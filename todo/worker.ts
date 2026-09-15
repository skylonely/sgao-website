const CHECKLIST_API_ORIGIN = "https://api.sgao.cc";

interface Env {
  ASSETS: Fetcher;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/lists/") && (request.method === "GET" || request.method === "HEAD")) {
      const slug = url.pathname.slice("/lists/".length).replace(/\/$/, "");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return env.ASSETS.fetch(request);
      }
      const listPageUrl = new URL("/list", url);
      const response = await env.ASSETS.fetch(new Request(listPageUrl, request));
      if (request.method === "HEAD" || !response.ok) return response;

      return new HTMLRewriter()
        .on("head", {
          element(element) {
            element.prepend(
              `<script>(()=>{const p=location.pathname+location.search+location.hash;const s=decodeURIComponent(location.pathname.slice(7)).replace(/\\/$/,"");window.__SGAO_TODO_LIST_SLUG__=s;const q=new URLSearchParams(location.search);q.set("list",s);history.replaceState(history.state,"","/list?"+q);addEventListener("load",()=>history.replaceState(history.state,"",p),{once:true})})()</script>`,
              { html: true },
            );
          },
        })
        .transform(response);
    }

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
