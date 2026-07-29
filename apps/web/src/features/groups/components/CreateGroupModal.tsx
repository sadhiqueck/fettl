import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { IconStack } from "@/shared/components/reui/icon-stack";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/shared/components/ui/empty";
import {
  Search,
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useUserProfile } from "@/shared/hooks/useUser";
import {
  useCreateGroup,
  useAddMember,
  useAddMemberByEmail,
} from "@/features/groups/hooks/useGroups";
import {
  useAllContacts,
  type GroupContact,
} from "@/features/groups/hooks/useAllContacts";
import {
  useUserSearch,
  type SearchedUser,
} from "@/shared/hooks/useUserSearch";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

// Category IDs must match the backend GroupCategory enum exactly when uppercased
const CATEGORIES = [
  {
    id: "TRIP",
    label: "Trip",
    imageUrl: "/icons/travel.png",
  },
  {
    id: "HOME",
    label: "Home",
    imageUrl: "/icons/home.png",
  },
  {
    id: "OFFICE",
    label: "Work",
    imageUrl: "/icons/office.png",
  },
  {
    id: "FOOD",
    label: "Food",
    imageUrl: "/icons/other.png", // Fallback to other.png since there's no food.png
  },
  {
    id: "ROOMMATES",
    label: "Roommates",
    imageUrl: "/icons/friends.png",
  },
  {
    id: "OTHER",
    label: "Other",
    imageUrl: "/icons/other.png",
  },
];

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupModal({
  open,
  onOpenChange,
}: CreateGroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // Search & Contacts
  const { data: currentUser } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: searchResults, isLoading: isSearching } =
    useUserSearch(debouncedSearch);
  const { contacts } = useAllContacts();

  // Filter out current user from search results
  const filteredSearchResults = searchResults?.filter(
    (u) => u.id !== currentUser?.id && u.email !== currentUser?.email
  ) || [];

  // Selected Members
  const [selectedMembers, setSelectedMembers] = useState<
    Map<string, SearchedUser | GroupContact>
  >(new Map());

  // Mutations
  const createGroupMutation = useCreateGroup();
  const addMemberMutation = useAddMember();
  const addMemberByEmailMutation = useAddMemberByEmail();

  const handleClose = () => {
    // Don't reset while a mutation is in flight
    if (isCreating) return;
    setStep(1);
    setName("");
    setDescription("");
    setCategory("");
    setSearchQuery("");
    setSelectedMembers(new Map());
    onOpenChange(false);
  };

  const toggleMember = (user: SearchedUser | GroupContact) => {
    setSelectedMembers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    createGroupMutation.mutate(
      { name, category, description: description || undefined },
      {
        onSuccess: async (response) => {
          // response is { message: string, group: { id, ... } }
          const groupId = response?.group?.id;

          if (selectedMembers.size > 0 && groupId) {
            const members = Array.from(selectedMembers.values());

            // For members with email, use addMemberByEmail; for those with only userId, use addMember
            const promises = members.map((member) => {
              if ("email" in member && member.email) {
                return addMemberByEmailMutation
                  .mutateAsync({ groupId, email: member.email })
                  .catch(() => null);
              }
              return addMemberMutation
                .mutateAsync({ groupId, userId: member.id })
                .catch(() => null);
            });

            await Promise.all(promises);
          }

          toast.success("Group created successfully!");
          handleClose();
        },
        onError: () => {
          // useCreateGroup already shows a toast in onError
        },
      },
    );
  };

  const isCreating =
    createGroupMutation.isPending ||
    addMemberMutation.isPending ||
    addMemberByEmailMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={isCreating ? undefined : handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border shadow-xl sm:rounded-2xl">
        {/* STEP 1: Details & Category */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-left-4 fade-in duration-300 min-h-135">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                Create a group
              </DialogTitle>
              <DialogDescription>
                Set up your group to split expenses together.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-group-name">Group Name</Label>
                <Input
                  id="create-group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Weekend trip"
                  className="rounded-2xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-group-description">
                  Description (Optional)
                </Label>
                <Input
                  id="create-group-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label>Category</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "relative flex items-center gap-2 p-2 rounded-2xl border bg-card transition-all hover:border-primary/50 group text-left",
                        category === cat.id
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border",
                      )}
                    >
                      <IconStack
                        className={cn(
                          "h-8 w-8 shrink-0 transition-transform group-hover:scale-105 p-0 overflow-hidden",
                          category === cat.id && "border-primary/50",
                        )}
                      >
                        <img src={cat.imageUrl} alt={cat.label} className="h-full w-full object-cover" />
                      </IconStack>
                      <span className="text-xs sm:text-sm font-medium leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-auto pt-4">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep(2)} disabled={!name.trim() || !category}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Members */}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-5 animate-in slide-in-from-right-4 fade-in duration-300 min-h-[540px] max-h-[85vh]">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-2 rounded-full"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl">Add members</DialogTitle>
              </div>
              <DialogDescription>
                Invite people to your group. You can also do this later.
              </DialogDescription>
            </DialogHeader>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-border rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Selected Chips */}
            <div className="flex flex-wrap gap-2">
              {/* Current User (Always first, no delete) */}
              {currentUser && (
                <div className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1 text-sm border border-border">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={currentUser.avatarUrl || undefined} />
                    <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-[120px]">
                    {currentUser.name.split(" ")[0]} (You)
                  </span>
                </div>
              )}

              {/* Other Selected Contacts */}
              {Array.from(selectedMembers.values()).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1 text-sm border border-border animate-in fade-in zoom-in-95 duration-200"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-[120px]">
                    {user.name.split(" ")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleMember(user)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 max-h-[300px]">
              {/* Search Results */}
              {debouncedSearch.length >= 3 &&
                searchResults &&
                searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Search Results
                    </h4>
                    {filteredSearchResults.map((user) => {
                      const isSelected = selectedMembers.has(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/50 transition-colors group cursor-pointer"
                          onClick={() => toggleMember(user)}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? "ghost" : "secondary"}
                            className={cn(
                              "shrink-0 rounded-full h-8 px-3",
                              isSelected ? "text-primary" : ""
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMember(user);
                            }}
                          >
                            {isSelected ? (
                              <>
                                <Check className="mr-1 h-3.5 w-3.5" /> Added
                              </>
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Existing Contacts */}
              {debouncedSearch.length < 3 && (
                <div className="space-y-2">
                  {contacts.length > 0 ? (
                    <>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Contacts
                      </h4>
                      {contacts.map((contact) => {
                        const isSelected = selectedMembers.has(contact.id);
                        return (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/50 transition-colors group cursor-pointer"
                            onClick={() => toggleMember(contact)}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={contact.avatarUrl || undefined}
                                />
                                <AvatarFallback>
                                  {contact.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {contact.name}
                                </p>
                                {contact.email && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {contact.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={isSelected ? "ghost" : "outline"}
                              className={cn(
                                "shrink-0 h-8 rounded-full px-3",
                                isSelected
                                  ? "text-primary"
                                  : "opacity-0 group-hover:opacity-100",
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMember(contact);
                              }}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="mr-1 h-3.5 w-3.5" /> Added
                                </>
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="py-8">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia>
                            <IconStack className="h-16 w-16 rounded-xl border-border bg-card shadow-sm p-0 flex items-center justify-center">
                              <UserPlus className="h-7 w-7 text-muted-foreground" />
                            </IconStack>
                          </EmptyMedia>
                          <EmptyTitle className="text-xl font-semibold mt-4">
                            Invite the first people in
                          </EmptyTitle>
                          <EmptyDescription className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                            Bring friends, roommates, and family into the group with a fast email invite.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-border mt-auto">
              <Button variant="ghost" onClick={handleSubmit} disabled={isCreating}>
                Skip for now
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
