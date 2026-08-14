"use client";

import { useEffect, useState } from "react";
import { getApiHealth } from "@/lib/api";

type Status = "checking" | "ok" | "degraded" | "offline";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    getApiHealth()
      .then((health) => {
        if (!cancelled) {
          setStatus(health.status === "ok" ? "ok" : "degraded");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("offline");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const label = {
    checking: "Checking API…",
    ok: "API healthy",
    degraded: "API degraded",
    offline: "API offline",
  }[status];

  const dotClass = {
    checking: "bg-slate-400",
    ok: "bg-emerald-500",
    degraded: "bg-amber-500",
    offline: "bg-slate-400",
  }[status];

  return (
    <p className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </p>
  );
}
