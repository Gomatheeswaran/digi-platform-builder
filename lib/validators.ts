export function isGmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim().toLowerCase());
}

export function isValidDomain(domain: string): boolean {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
    domain.trim().toLowerCase()
  );
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,40}$/.test(slug);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 40);
}
