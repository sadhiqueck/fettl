// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/lib/apiClient";
import AuthPage from "@/pages/AuthPage";
import { ProtectedRoute, PublicRoute } from "./RouteGuards";

vi.mock("@/shared/lib/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});

it.each([
  ["/dashboard", "Session expired"],
  ["/profile", "Network Error"],
  ["/analytics", "Service unavailable"],
  ["/groups/shared-trip", "Network Error"],
])(
  "opens sign-in from %s when the session check fails",
  async (path, message) => {
    vi.mocked(apiClient.get).mockRejectedValue(new AxiosError(message));
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="*" element={<h1>Private workspace</h1>} />
            </Route>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<AuthPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeTruthy();
    expect(screen.queryByText("Private workspace")).toBeNull();
  },
);

it("keeps the OTP step after the sign-in page remounts", async () => {
  vi.mocked(apiClient.get).mockRejectedValue(new AxiosError("No session"));
  vi.mocked(apiClient.post).mockResolvedValue({ data: { message: "Sent" } });
  const renderLogin = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<AuthPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  const first = renderLogin();
  fireEvent.change(await screen.findByLabelText("Email address"), {
    target: { value: "Person@Example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Continue with email/i }));
  expect(await screen.findByLabelText("Verification code")).toBeTruthy();
  expect(screen.getByText(/person@example.com/)).toBeTruthy();
  expect(apiClient.post).toHaveBeenCalledWith("/auth/passwordless/start", {
    email: "person@example.com",
  });

  first.unmount();
  renderLogin();
  expect(await screen.findByLabelText("Verification code")).toBeTruthy();
  expect(screen.queryByLabelText("Email address")).toBeNull();
});
