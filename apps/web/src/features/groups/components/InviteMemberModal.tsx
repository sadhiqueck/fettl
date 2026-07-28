import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Input } from "@/shared/components/ui/input";
import {
  Users as GroupIcon,
  Check as CheckIcon,
  Copy,
  Share2,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGroupContacts,
  useAddMember,
  useAddMemberByEmail,
} from "@/features/groups/hooks/useGroups";
import { useUserSearch } from "@/shared/hooks/useUserSearch";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { AxiosError } from "axios";

interface InviteMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  inviteCode?: string;
}


export function InviteMemberModal({
  isOpen,
  onOpenChange,
  groupId,
  groupName,
  inviteCode,
}: InviteMemberModalProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const debouncedEmail = useDebounce(email, 300);
  const { data: searchResults, isLoading: isSearching } =
    useUserSearch(debouncedEmail);

  const { data: contacts, isLoading: contactsLoading } =
    useGroupContacts(groupId);
  const addMemberMutation = useAddMember();
  const addMemberByEmailMutation = useAddMemberByEmail();

  // Reset states when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
    }
    onOpenChange(open);
  };

  const handleConfirmAdd = (targetEmail: string, targetName: string) => {
    const toastId = toast.loading("Adding user to group...");

    addMemberByEmailMutation.mutate(
      { groupId, email: targetEmail },
      {
        onSuccess: () => {
          toast.success(`${targetName} added to the group!`, {
            id: toastId,
          });
          setEmail("");
        },
        onError: (error: Error) => {
          const err = error as AxiosError<{ message: string }>;
          toast.error(err.response?.data?.message || "Failed to add user", {
            id: toastId,
          });
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="app-card-elevated border-0 ring-0 rounded-3xl max-w-sm text-center flex flex-col items-center p-8">
        <div className="app-card p-4 mb-4 bg-soft-clay rounded-full">
          <GroupIcon size={32} className="text-primary" />
        </div>
        <DialogTitle className="font-display text-xl font-bold mb-2">
          Invite Members
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mb-6">
          Share this code with your friends so they can join {groupName}.
        </DialogDescription>

        <div className="w-full bg-soft-clay p-4 rounded-2xl flex items-center justify-between mb-6 shadow-inner">
          <span className="font-mono text-xl font-bold tracking-widest text-foreground select-all">
            {inviteCode || "No Code"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="clay-btn-ghost size-10 rounded-xl"
            onClick={() => {
              if (inviteCode) {
                navigator.clipboard.writeText(inviteCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
          >
            {copied ? (
              <CheckIcon size={18} className="text-green-500" />
            ) : (
              <Copy size={18} />
            )}
          </Button>
        </div>

        <Button
          className="clay-btn-primary w-full py-6 text-sm font-display flex items-center gap-2 justify-center shadow-lg"
          onClick={async () => {
            if (navigator.share && inviteCode) {
              try {
                await navigator.share({
                  title: `Join ${groupName} on Fettl`,
                  text: `Hey! Join my group on Fettl to split expenses easily. Use this invite link: ${import.meta.env.VITE_FRONTEND_URL}/groups/join/${inviteCode}`,
                });
              } catch (error) {
                console.error("Error sharing", error);
              }
            } else if (inviteCode) {
              navigator.clipboard.writeText(
                `${import.meta.env.VITE_FRONTEND_URL}/groups/join/${inviteCode}`,
              );
              setCopied(true);
              toast.success("Invite link copied to clipboard!");
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          <Share2 size={18} />
          Share Invite Code
        </Button>

        <div className="w-full mt-6">
          <div className="relative">
            <Input
              name="email"
              type="text"
              placeholder="Search users by email..."
              className="clay-input w-full h-12 text-sm pl-4 pr-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground animate-spin" />
            )}
          </div>

          {email.length >= 3 && searchResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 text-left">
                Search Results
              </p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-soft-clay rounded-xl border border-border/50"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="size-8">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-semibold truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="clay-btn-primary px-3 rounded-full h-8"
                    onClick={() => handleConfirmAdd(user.email, user.name)}
                    disabled={addMemberByEmailMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Friends Section */}
        <div className="w-full mt-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Or Add Friends
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {contactsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 text-left">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-soft-clay transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {contact.avatarUrl && (
                        <AvatarImage
                          src={contact.avatarUrl}
                          alt={contact.name}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate max-w-30">
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-30">
                        {contact.email}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    onClick={() => {
                      const toastId = toast.loading(
                        `Adding ${contact.name}...`,
                      );
                      addMemberMutation.mutate(
                        {
                          groupId,
                          userId: contact.id,
                        },
                        {
                          onSuccess: () =>
                            toast.success(`${contact.name} added!`, {
                              id: toastId,
                            }),
                          onError: (error: Error) => {
                            const err = error as AxiosError<{
                              message: string;
                            }>;
                            toast.error(
                              err.response?.data?.message ||
                                "Failed to add user",
                              { id: toastId },
                            );
                          },
                        },
                      );
                    }}
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending &&
                    addMemberMutation.variables?.userId === contact.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground p-2">
              No recent contacts found to add directly.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
