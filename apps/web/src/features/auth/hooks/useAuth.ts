import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// Simulated API calls for when the NestJS endpoints are not yet ready
const simulateApiCall = async <T>(data: T, shouldFail = false, delay = 1500): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Simulated API Error"));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

export function useAuth() {
  const sendOtp = useMutation({
    mutationFn: async (email: string) => {
      // TODO: Replace with real NestJS axios call: return axios.post('/api/auth/send-otp', { email })
      console.log(`Sending OTP to ${email}`);
      return simulateApiCall({ success: true, email });
    },
    onSuccess: (_, email) => {
      toast.success(`Verification code sent to ${email}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send verification code. Please try again.");
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      // TODO: Replace with real NestJS axios call: return axios.post('/api/auth/verify-otp', { email, otp })
      console.log(`Verifying OTP ${otp} for ${email}`);
      // Simulate failure if OTP is not 123456 (just for testing error UI)
      const shouldFail = otp !== "123456";
      if (shouldFail) {
        throw new Error("Invalid verification code");
      }
      return simulateApiCall({ success: true, token: "jwt_token_here" }, false, 1000);
    },
    onSuccess: () => {
      toast.success("Successfully verified!");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid code. Please try again.");
    },
  });

  const loginWithGoogle = () => {
    // Redirect the browser directly to the backend NestJS endpoint
    // The backend will handle the Google redirect, and then redirect back to the frontend with the token.
    const googleAuthUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/auth/google` 
      : "http://localhost:3000/api/auth/google"; // Fallback for local dev
    
    window.location.href = googleAuthUrl;
  };

  return {
    sendOtp,
    verifyOtp,
    loginWithGoogle,
  };
}
