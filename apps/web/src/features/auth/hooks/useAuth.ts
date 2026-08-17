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
    window.location.assign(`${apiClient.defaults.baseURL}/auth/google`);
  };
  return { sendOtp, verifyOtp, loginWithGoogle };
}
