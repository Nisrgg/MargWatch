export function parseComplaintImages(imageUrl?: string | null): string[] {
  if (!imageUrl) return [];

  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === 'string' && !!u);
    }
    if (typeof parsed === 'string') {
      return [parsed];
    }
  } catch {
    // fall through to fallback handling
  }

  return typeof imageUrl === 'string' && imageUrl ? [imageUrl] : [];
}

