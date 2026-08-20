"use client";

import { useEffect } from "react";
import { recordPageView } from "@/lib/api";

export function TrackPageView(props: {
  path: string;
  entityType?: "product" | "guide" | "comparison" | "category" | "best";
  entityId?: string;
}) {
  useEffect(() => {
    void recordPageView(props);
  }, [props.path, props.entityType, props.entityId]);

  return null;
}
