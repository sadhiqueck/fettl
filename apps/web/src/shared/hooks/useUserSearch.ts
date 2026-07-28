import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/apiClient";

export interface SearchedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function useUserSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      const { data } = await apiClient.get<SearchedUser[]>(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      return data;
    },
    enabled: enabled && query.length >= 3,
    staleTime: 1000 * 30, // 30 seconds
  });
}
