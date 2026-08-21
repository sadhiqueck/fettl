// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/lib/apiClient";
import { ProtectedRoute } from "./RouteGuards";

vi.mock("@/shared/lib/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

afterEach(cleanup);

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
            <Route path="/login" element={<h1>Sign in</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeTruthy();
    expect(screen.queryByText("Private workspace")).toBeNull();
  },
);
