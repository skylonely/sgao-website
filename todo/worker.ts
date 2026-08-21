const CHECKLIST_API_ORIGIN = "https://api.sgao.cc";

interface Env {
  ASSETS: Fetcher;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (!url.pathname.startsWith("/api/v1/checklists/")) {
        return Response.json({ error: { code: "NOT_FOUND", message: "API route not found" } }, { status: 404 });
      }
      if (request.method !== "GET" && request.method !== "PUT") {
        return Response.json(
          { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } },
          { status: 405, headers: { Allow: "GET, PUT" } },
        );
      }

      const upstreamUrl = new URL(`${url.pathname}${url.search}`, CHECKLIST_API_ORIGIN);
      const upstreamRequest = new Request(upstreamUrl, request);
      upstreamRequest.headers.delete("Origin");
      const upstreamResponse = await fetch(upstreamRequest);
      const headers = new Headers(upstreamResponse.headers);
      headers.delete("Access-Control-Allow-Origin");
      headers.delete("Access-Control-Allow-Credentials");

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
