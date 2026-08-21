export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "certificate";
}

export function certificateFilename(recipientName: string, extension: string): string {
  return `${slugify(recipientName)}-certificate.${extension}`;
}
