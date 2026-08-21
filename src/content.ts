export const sectionOptions = ["tech", "commercial", "cultures", "fieldnotes"] as const;
export const contentTypeOptions = ["case", "research", "essay", "fieldnote"] as const;

export type PostSection = (typeof sectionOptions)[number];
export type ContentType = (typeof contentTypeOptions)[number];
export type PostStatus = "draft" | "published";

export type ManagedPost = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  section: PostSection;
  contentType: ContentType;
  tags: string[];
  featured: boolean;
  status: PostStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export const ownerEmail = "jadeli0630@gmail.com";

export function formatPostMonth(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
  return `${month}, ${date.getUTCFullYear()}`;
}

export function contentTypeLabel(value: ContentType) {
  return value === "fieldnote" ? "FIELDNOTE" : value.toUpperCase();
}

export function sectionLabel(value: PostSection) {
  return value === "fieldnotes" ? "ONLY FIELDNOTES" : value.toUpperCase();
}
