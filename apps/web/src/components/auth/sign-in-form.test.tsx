import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SignInForm } from "./sign-in-form";

const push = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signInWithPassword },
  }),
}));

describe("SignInForm", () => {
  it("shows validation errors for empty submission", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("submits credentials and redirects to the dashboard", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "a-strong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "a-strong-password",
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("keeps the user on the page and reports a failed sign-in", async () => {
    signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });
    push.mockClear();
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(push).not.toHaveBeenCalled();
  });
});
