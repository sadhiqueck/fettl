import { useState } from "react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useUserProfile } from "@/shared/hooks/useUser";
import { NavRail, type NavFilter } from "@/shared/components/layout/NavRail";
import { GroupListSidebar } from "@/shared/components/layout/GroupListSidebar";
import { ProfileSidebar } from "@/shared/components/layout/ProfileSidebar";
import { GroupInfoSidebar } from "@/shared/components/layout/GroupInfoSidebar";
import { useGroups, useJoinGroup, useGroup } from "@/features/groups/hooks/useGroups";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { CreateGroupModal } from "@/features/groups/components/CreateGroupModal";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { InviteMemberModal } from "@/features/groups/components/InviteMemberModal";
import {
  PlusIcon,
  LinkIcon,
} from "@/shared/components/ui/icons";
import { PageSkeleton } from "@/shared/components/layout/PageSkeleton";

export function ChatAppLayout() {
  const { id: activeGroupId } = useParams();
  const location = useLocation();
  const hideGroupList =
    !!activeGroupId || location.pathname === "/profile" || location.pathname === "/analytics";
  const { data: user } = useUserProfile();
  const { data: groups = [], isLoading, isError, error, refetch } = useGroups();
  const { data: activeGroup } = useGroup(activeGroupId);
  const joinGroupMutation = useJoinGroup();

  const [navFilter, setNavFilter] = useState<NavFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const CATEGORY_MAP: Record<string, NavFilter> = {
    TRIP: "TRIP",
    TRAVEL: "TRIP",
    HOME: "HOME",
    OFFICE: "OFFICE",
    WORK: "OFFICE",
    FRIENDS: "FRIENDS",
    OTHER: "OTHER",
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const catKey = g.category.toUpperCase();
    const normalizedCategory = CATEGORY_MAP[catKey] ?? "OTHER";
    const matchesFilter =
      navFilter === "all" || normalizedCategory === navFilter;
    return matchesSearch && matchesFilter;
  });

  const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inviteCode = new FormData(e.currentTarget).get("inviteCode") as string;
    if (inviteCode) {
      joinGroupMutation.mutate(inviteCode, {
        onSuccess: () => {
          setJoinOpen(false);
          (e.target as HTMLFormElement).reset();
        },
      });
    }
  };

  return (
    <div className="chat-shell-wrapper">
      <div className="chat-shell">
        <NavRail
          activeFilter={navFilter}
          onFilterChange={setNavFilter}
          groupCount={groups.length}
          onCreateGroup={() => setCreateOpen(true)}
        />

        <div className="chat-middle-container">
          {location.pathname === "/profile" ? (
            <ProfileSidebar className={hideGroupList ? "hidden md:flex" : "flex"} />
          ) : (
            <GroupListSidebar
              className={hideGroupList ? "hidden md:flex" : "flex"}
              groups={filteredGroups}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
              onJoinGroup={() => setJoinOpen(true)}
            />
          )}

          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${!hideGroupList && location.pathname !== "/profile" ? "hidden md:flex" : "flex"}`}>
            {isError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
                <AlertCircle size={48} className="text-coral-red" />
                <p className="text-muted-foreground text-center max-w-sm">
                  {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    "Could not load groups."}
                </p>
                <button onClick={() => refetch()} className="clay-btn-primary px-6 py-2 text-sm">
                  Try again
                </button>
              </div>
            ) : isLoading ? (
              <PageSkeleton />
            ) : (
              <Outlet />
            )}
          </div>
        </div>

        {activeGroup && activeGroupId && (
          <GroupInfoSidebar
            group={activeGroup}
            onInvite={() => setInviteOpen(true)}
          />
        )}
      </div>

      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />

      {/* Join Group Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="app-card-elevated border-0 ring-0 rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="app-card p-2">
                <LinkIcon size={28} />
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  Join a group
                </DialogTitle>
                <DialogDescription>
                  Enter the invite code from your friend.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code" className="font-display font-semibold text-sm">
                Invite code
              </Label>
              <Input id="invite-code" name="inviteCode" placeholder="ABC-12345" className="clay-input text-center text-lg font-mono tracking-widest" required disabled={joinGroupMutation.isPending} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)} className="clay-btn-ghost" disabled={joinGroupMutation.isPending}>
                Cancel
              </Button>
              <button type="submit" disabled={joinGroupMutation.isPending} className="clay-btn-primary px-6 py-2 text-sm font-display font-bold flex items-center gap-2">
                {joinGroupMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                Join group
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {activeGroup && activeGroupId && (
        <InviteMemberModal
          isOpen={inviteOpen}
          onOpenChange={setInviteOpen}
          groupId={activeGroupId}
          groupName={activeGroup.name}
          inviteCode={activeGroup.inviteCode}
        />
      )}
    </div>
  );
}
