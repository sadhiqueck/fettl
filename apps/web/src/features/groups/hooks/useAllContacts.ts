import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import { useUserProfile } from "@/shared/hooks/useUser";
import { type ContactData } from "./useGroups";

export type GroupContact = ContactData;

export function useAllContacts() {
  const { data: currentUser } = useUserProfile();

  const query = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: async () => {
      const response = await apiClient.get("/groups/contacts");
      return response.data.contacts as GroupContact[];
    },
    enabled: !!currentUser,
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
  };
}
