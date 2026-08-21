import { apiClient } from "@/shared/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { User, UpdateProfileInput } from "@fettl/shared";
import { toast } from "sonner";

const userKeys = {
  profile: ["user", "profile"] as const,
};

async function fetchUserProfile(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me", { timeout: 10_000 });
  return data;
}

async function updateUserProfile(payload: UpdateProfileInput): Promise<User> {
  const { data } = await apiClient.patch<User>("/users/me", payload);
  return data;
}

async function logoutUser(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export function useUserProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: fetchUserProfile,
    networkMode: "always",
    staleTime: 1000 * 60 * 5,
    retry: false, // don't retry 401s so route guards resolve quickly
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      // Writes the server-confirmed response into the cache directly.
      queryClient.setQueryData(userKeys.profile, updatedUser);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try clearing your cookies.");
    },
  });
}
