import type { ContentType, ManagedPost, PostSection } from "./content";

type Frontmatter = Record<string, string>;

function parseFrontmatter(source: string) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {} as Frontmatter, body: source.trim() };

  const data = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([A-Za-z][A-Za-z ]*):\s*(.*)$/))
      .filter((entry): entry is RegExpMatchArray => Boolean(entry))
      .map((entry) => [entry[1].trim(), entry[2].trim().replace(/^['"]|['"]$/g, "")]),
  );

  return { data, body: match[2].trim() };
}

function booleanValue(value = "") {
  return ["true", "yes", "1"].includes(value.toLowerCase());
}

function tagsValue(value = "") {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

const markdownFiles = import.meta.glob("../content/posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const publishedPosts: ManagedPost[] = Object.entries(markdownFiles)
  .filter(([path]) => !path.endsWith("/README.md") && !path.split("/").pop()?.startsWith("_"))
  .map(([path, source], index) => {
    const { data, body } = parseFrontmatter(source);
    const fallbackSlug = path.split("/").pop()?.replace(/\.md$/, "") ?? `post-${index + 1}`;
    const publishedAt = data["Publish Date"] || new Date().toISOString().slice(0, 10);
    return {
      id: index + 1,
      slug: data.Slug || fallbackSlug,
      title: data.Title || fallbackSlug,
      summary: data.Summary || "",
      body,
      section: (data.Section || "fieldnotes").toLowerCase() as PostSection,
      contentType: (data["Content Type"] || "fieldnote").toLowerCase() as ContentType,
      tags: tagsValue(data["Capability Tags"]),
      featured: booleanValue(data["Featured on Home"]),
      status: "published" as const,
      publishedAt,
      createdAt: publishedAt,
      updatedAt: publishedAt,
    };
  })
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
