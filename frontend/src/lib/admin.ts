export function safeAdminPath(value?: string | null): string {
  if (!value) {
    return "/admin/products";
  }

  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("://")) {
    return "/admin/products";
  }

  return value;
}

export function redirectToLogin(next = "/admin/products"): void {
  window.location.assign(`/admin/login?next=${encodeURIComponent(safeAdminPath(next))}`);
}
