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
      <DialogContent className="max-w-md">
        <DialogTitle className="text-base font-semibold">
          Invite members
        </DialogTitle>
        <DialogDescription>
          Share this code or link to invite someone to {groupName}.
        </DialogDescription>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
          <span className="select-all font-mono text-base font-semibold tracking-widest text-foreground">
            {inviteCode || "No Code"}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Copy invite code"
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
          className="w-full"
          onClick={async () => {
            if (navigator.share && inviteCode) {
              try {
                await navigator.share({
                  title: `Join ${groupName} on Fettl`,
                  text: `Hey! Join my group on Fettl to split expenses easily. Use this invite link: ${window.location.origin}/groups/join/${inviteCode}`,
                });
              } catch (error) {
                console.error("Error sharing", error);
              }
            } else if (inviteCode) {
              navigator.clipboard.writeText(
                `${window.location.origin}/groups/join/${inviteCode}`,
              );
              setCopied(true);
              toast.success("Invite link copied to clipboard!");
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          <Share2 size={18} />
          Share invite link
        </Button>

        <div>
          <div className="relative">
            <Input
              name="email"
              type="text"
              placeholder="Search by email"
              aria-label="Search users by email"
              className="pr-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground animate-spin" />
            )}
          </div>

          {email.length >= 3 && searchResults && searchResults.length > 0 && (
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Search results
              </p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2"
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

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium">Recent contacts</p>

          {contactsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 text-left">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="group flex items-center justify-between rounded-lg p-2 hover:bg-muted"
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
                    className="h-8 w-8 p-0"
                    aria-label={`Add ${contact.name}`}
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
