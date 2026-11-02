// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/lib/apiClient";
import MagicLinkPage from "./MagicLinkPage";

vi.mock("@/shared/lib/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("does not use a magic link until its confirmation button is pressed", async () => {
  const token = "a".repeat(64);
  vi.mocked(apiClient.post).mockResolvedValue({ data: { user: { id: "one" } } });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/auth/confirm#token=${token}`]}>
        <Routes>
          <Route path="/auth/confirm" element={<MagicLinkPage />} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  expect(screen.getByRole("heading", { name: "Confirm sign in" })).toBeTruthy();
  expect(apiClient.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continue to Fettl" }));
  await waitFor(() =>
    expect(apiClient.post).toHaveBeenCalledWith("/auth/magic-link/verify", {
      token,
    }),
  );
  expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeTruthy();
});
