import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/apiClient";

export function useAuth() {
  const sendOtp = useMutation({
    mutationFn: (email: string) =>
      apiClient.post("/auth/passwordless/start", { email }),
  });
  const verifyOtp = useMutation({
    mutationFn: (data: { email: string; otp: string }) =>
      apiClient.post("/auth/passwordless/verify", data),
  });
  const loginWithGoogle = () => {
    const url = new URL(`${apiClient.defaults.baseURL}/auth/google`);
    url.searchParams.set("returnTo", window.location.origin);
    window.location.assign(url.toString());
  };
  return { sendOtp, verifyOtp, loginWithGoogle };
}
