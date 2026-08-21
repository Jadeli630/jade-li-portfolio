interface Env {
  ASSETS: Fetcher;
  COMMENTS_DB?: D1Database;
}

type CommentPayload = {
  context?: string;
  name?: string;
  email?: string;
  body?: string;
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function handleComments(request: Request, env: Env) {
  if (!env.COMMENTS_DB) {
    return request.method === "GET"
      ? json({ comments: [] })
      : json({ error: "Comments are being activated. Please try again shortly." }, 503);
  }

  if (request.method === "POST") {
    let payload: CommentPayload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const body = payload.body?.trim() ?? "";
    if (!body) return json({ error: "Comment is required" }, 400);
    if (body.length > 3000) return json({ error: "Comment is too long" }, 400);

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

    return json({ submitted: true }, 201);
  }

  if (request.method === "GET") {
    const context = new URL(request.url).searchParams.get("context")?.trim();
    if (!context) return json({ comments: [] });

    const result = await env.COMMENTS_DB.prepare(
      "SELECT id, post_context, name, body, created_at FROM comments WHERE status = 'approved' AND post_context = ? ORDER BY created_at DESC LIMIT 50",
    )
      .bind(context)
      .all();

    return json({ comments: result.results ?? [] });
  }

  return new Response("Method not allowed", { status: 405 });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/comments") return handleComments(request, env);
    return env.ASSETS.fetch(request);
  },
};
