import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, UpdateProfileInput } from "@settleup/shared";

async function fetchUserProfile(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}

async function updateUserProfile(payload: UpdateProfileInput): Promise<User> {
  const { data } = await apiClient.patch<User>("users/me", payload);
  return data;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryclient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedData) => {
    // Optimistically update the cache so the UI reflects the change instantly!
      queryclient.setQueryData(["user-profile"], updatedData);
    },
  });
}
