export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export interface WishPayload {
  title?: unknown;
  description?: unknown;
}

export function validateWishPayload(body: WishPayload): {
  valid: boolean;
  error?: string;
  data?: { title: string; description?: string };
} {
  if (
    !body.title ||
    typeof body.title !== "string" ||
    body.title.trim() === ""
  ) {
    return { valid: false, error: "title is required" };
  }
  if (body.title.length > 50) {
    return { valid: false, error: "title must not exceed 50 characters" };
  }
  if (
    body.description &&
    typeof body.description === "string" &&
    body.description.length > 300
  ) {
    return { valid: false, error: "description must not exceed 300 characters" };
  }
  const description =
    body.description && typeof body.description === "string"
      ? body.description
      : undefined;
  return { valid: true, data: { title: body.title.trim(), description } };
}
