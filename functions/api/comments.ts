interface Env {
  COMMENTS_DB: D1Database;
}

type PagesContext = EventContext<Env, string, Record<string, unknown>>;

export const onRequestPost = async ({ request, env }: PagesContext) => {
  let payload: { context?: string; name?: string; email?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const body = payload.body?.trim() ?? "";
  if (!body) return Response.json({ error: "Comment is required" }, { status: 400 });
  if (body.length > 3000) return Response.json({ error: "Comment is too long" }, { status: 400 });

  await env.COMMENTS_DB.prepare(
    "INSERT INTO comments (post_context, name, email, body, status) VALUES (?, ?, ?, ?, 'pending')",
  )
    .bind(
      payload.context?.trim().slice(0, 240) || "Home",
      payload.name?.trim().slice(0, 80) || "Reader",
      payload.email?.trim().toLowerCase().slice(0, 160) || "",
      body,
    )
    .run();

  return Response.json({ submitted: true }, { status: 201 });
};

export const onRequestGet = async ({ request, env }: PagesContext) => {
  const url = new URL(request.url);
  const context = url.searchParams.get("context")?.trim();
  if (!context) return Response.json({ comments: [] });

  const result = await env.COMMENTS_DB.prepare(
    "SELECT id, post_context, name, body, created_at FROM comments WHERE status = 'approved' AND post_context = ? ORDER BY created_at DESC LIMIT 50",
  )
    .bind(context)
    .all();

  return Response.json({ comments: result.results ?? [] });
};
