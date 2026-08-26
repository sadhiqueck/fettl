import { useNavigate } from "react-router-dom";
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
import {
  Search,
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Plane,
  House,
  BriefcaseBusiness,
  UsersRound,
  Shapes,
} from "lucide-react";
import { useUserProfile } from "@/shared/hooks/useUser";
import {
  useCreateGroup,
  useAddMember,
} from "@/features/groups/hooks/useGroups";
import {
  useAllContacts,
  type GroupContact,
} from "@/features/groups/hooks/useAllContacts";
import { useUserSearch, type SearchedUser } from "@/shared/hooks/useUserSearch";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";

const CATEGORIES = [
  {
    id: "TRIP",
    label: "Trip",
    icon: Plane,
  },
  {
    id: "HOME",
    label: "Home",
    icon: House,
  },
  {
    id: "OFFICE",
    label: "Work",
    icon: BriefcaseBusiness,
  },
  {
    id: "FRIENDS",
    label: "Friends",
    icon: UsersRound,
  },
  {
    id: "OTHER",
    label: "Other",
    icon: Shapes,
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
  const navigate = useNavigate();
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
  const filteredSearchResults =
    searchResults?.filter(
      (u) => u.id !== currentUser?.id && u.email !== currentUser?.email,
    ) || [];

  // Selected Members
  const [selectedMembers, setSelectedMembers] = useState<
    Map<string, SearchedUser | GroupContact>
  >(new Map());

  // Mutations
  const createGroupMutation = useCreateGroup();
  const addMemberMutation = useAddMember();

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
    if (name.trim().length < 2 || !category) return;

    createGroupMutation.mutate(
      { name: name.trim(), category, description: description.trim() || undefined },
      {
        onSuccess: async (response) => {
          // response is { message: string, group: { id, ... } }
          const groupId = response?.group?.id;

          const results = await Promise.allSettled(
            Array.from(selectedMembers.keys(), (userId) =>
              addMemberMutation.mutateAsync({ groupId, userId }),
            ),
          );
          if (results.some((result) => result.status === "rejected")) {
            toast.warning(
              "Group created. Some members still need an invitation.",
            );
          } else {
            toast.success("Group created");
          }
          onOpenChange(false);
          navigate(`/groups/${groupId}`);
        },
        onError: () => toast.error("Couldn’t create the group. Please try again."),
      },
    );
  };

  const isCreating =
    createGroupMutation.isPending || addMemberMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={isCreating ? undefined : handleClose}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]" showCloseButton={false}>
        {step === 1 && (
          <div className="flex flex-col gap-6 p-6">
            <DialogHeader>
              <span className="text-xs font-semibold text-[var(--insight)]">Step 1 of 2 · Details</span>
              <DialogTitle className="text-xl font-semibold">Create a group</DialogTitle>
              <DialogDescription>
                Give your shared space a name and category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-group-name">Group name</Label>
                <Input
                  id="create-group-name"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Weekend trip"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-group-description">
                  Description (optional)
                </Label>
                <Input
                  id="create-group-description"
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you sharing?"
                />
              </div>
              <div className="space-y-2 pt-1">
                <Label id="group-category-label">Category</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-labelledby="group-category-label">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      aria-pressed={category === cat.id}
                      className={cn(
                        "flex min-h-16 items-center gap-3 rounded-lg border bg-card px-3 text-left text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        category === cat.id
                          ? "border-[var(--insight)] bg-accent text-accent-foreground"
                          : "border-border",
                      )}
                    >
                      <cat.icon size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-5">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={name.trim().length < 2 || !category}
              >
                Continue <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex max-h-[85vh] min-h-[480px] flex-col gap-5 p-6">
            <DialogHeader>
              <span className="text-xs font-semibold text-[var(--insight)]">Step 2 of 2 · People</span>
              <DialogTitle className="text-xl font-semibold">Add members</DialogTitle>
              <DialogDescription>
                Invite people to your group. You can also do this later.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search people by email"
                placeholder="Search by email"
                className="pl-9"
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
                    <AvatarFallback>
                      {currentUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-30">
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
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate max-w-30">
                    {user.name.split(" ")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleMember(user)}
                    aria-label={`Remove ${user.name}`}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              {/* Search Results */}
              {debouncedSearch.length >= 3 &&
                searchResults &&
                searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Search results
                    </h4>
                    {filteredSearchResults.map((user) => {
                      const isSelected = selectedMembers.has(user.id);
                      return (
                        <div
                          key={user.id}
                          className="group flex items-center justify-between rounded-lg border border-border p-2"
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
                            className="shrink-0"
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
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Recent contacts
                      </h4>
                      {contacts.map((contact) => {
                        const isSelected = selectedMembers.has(contact.id);
                        return (
                          <div
                            key={contact.id}
                            className="group flex items-center justify-between rounded-lg border border-border p-2"
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
                              className="shrink-0"
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
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-5 py-8 text-center">
                      <UserPlus size={23} className="text-muted-foreground" />
                      <h4 className="text-sm font-medium">No recent contacts</h4>
                      <p className="max-w-xs text-xs text-muted-foreground">
                        Search by email to add someone, or create the group and
                        invite them later.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isCreating}
                size="icon-sm"
                aria-label="Back to group details"
                className="sm:hidden"
              >
                <ArrowLeft size={15} />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isCreating}
                className="hidden sm:inline-flex"
              >
                <ArrowLeft size={15} /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  "Create group"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
