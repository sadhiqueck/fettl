import { useMemo } from "react";
import { useGroups, type ContactData } from "./useGroups";
import { useUserProfile } from "@/shared/hooks/useUser";

export type GroupContact = ContactData;

export function useAllContacts() {
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { data: currentUser, isLoading: isUserLoading } = useUserProfile();

  const contacts = useMemo(() => {
    if (!groups || !currentUser) return [];

    const contactMap = new Map<string, GroupContact>();

    groups.forEach((group) => {
      if (!group.members) return;

      group.members.forEach((member) => {
        // GroupMember has userId, name, avatarUrl directly (not nested in .user)
        if (member.userId && member.userId !== currentUser.id) {
          if (!contactMap.has(member.userId)) {
            contactMap.set(member.userId, {
              id: member.userId,
              name: member.name,
              email: "", // GroupMember doesn't carry email; will be empty for contact-added members
              avatarUrl: member.avatarUrl ?? undefined,
            });
          }
        }
      });
    });

    return Array.from(contactMap.values());
  }, [groups, currentUser]);

  return {
    contacts,
    isLoading: isGroupsLoading || isUserLoading,
  };
}
