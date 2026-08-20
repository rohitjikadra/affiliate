"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      await logoutAdmin();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onLogout()}
      disabled={pending}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-navy hover:bg-neutral-50 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
