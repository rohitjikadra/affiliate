"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { safeAdminPath } from "@/lib/admin";
import { SITE_NAME } from "@/lib/site";
import { ApiError } from "@/types/product";

type LoginFormProps = {
  next: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await loginAdmin(password);
      router.push(safeAdminPath(next));
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(err instanceof ApiError ? err.message : "Could not sign in. Try again.");
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="mx-auto w-full max-w-md rounded-md border border-neutral-200 bg-white p-8"
    >
      <p className="text-sm font-semibold text-navy">{SITE_NAME} Admin</p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-600">Enter the admin password to manage the shop.</p>

      <label htmlFor="admin-password" className="mt-6 block text-sm font-medium text-neutral-800">
        Password
      </label>
      <input
        id="admin-password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="mt-2 w-full rounded-md border border-neutral-300 px-4 py-3 text-neutral-900 outline-none focus:border-navy"
      />

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || password.trim() === ""}
        className="mt-6 w-full rounded-full bg-cta px-4 py-3 text-sm font-bold text-navy hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
