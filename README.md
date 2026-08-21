# Jade Li Portfolio

This is the Cloudflare Pages version of Jade Li's portfolio.

## Content workflow

Future posts live in `content/posts` as Markdown files. Each file controls its section, content type, capability tags, Home feature status and publish date through frontmatter.

## Comments

Comments are stored in Cloudflare D1 with `pending` status. Only approved comments are returned publicly.

## Cloudflare Pages

Build command: `npm run build`

Build output directory: `dist`

The Pages project requires a D1 binding named `COMMENTS_DB` and the schema in `migrations/0001_comments.sql`.
