export function formatRoleLabel(role: string): string {
  return role.replaceAll("_", " ");
}

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
