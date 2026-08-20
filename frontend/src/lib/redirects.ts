import { redirect } from "next/navigation";
import { ApiError } from "@/types/product";

export function handleMoved(error: unknown, prefix: string): void {
  if (error instanceof ApiError && error.status === 308 && error.redirectSlug) {
    redirect(`${prefix}/${error.redirectSlug}`);
  }
}
