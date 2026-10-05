export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 处理 CORS 预检请求
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token", 
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // 简单口令鉴权机制
    const clientToken = request.headers.get("X-Auth-Token");
    if (clientToken !== env.AUTH_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized: 暗号错误或未输入" }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    try {
      // 1. 获取所有项目列表
      if (path === "/" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM projects ORDER BY createdAt DESC").all();
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      // 2. 获取所有模板
      if (path === "/templates" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM templates").all();
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }

      // 3. 永久删除项目
      if (path === "/delete" && method === "POST") {
        const { id } = await request.json();
        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });
        
        await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(String(id)).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 4. 新增或更新项目
      if (path === "/" && method === "POST") {
        const p = await request.json();
        if (!p.n) return new Response(JSON.stringify({ error: "Invalid data structure" }), { status: 400, headers: corsHeaders });

        await env.DB.prepare(`
          INSERT INTO projects (id, n, tpl, un, am, s, memo, isArchived, isPinned, logs, archivedAt, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
          n=excluded.n, tpl=excluded.tpl, un=excluded.un, am=excluded.am, 
          s=excluded.s, memo=excluded.memo, isArchived=excluded.isArchived,
          isPinned=excluded.isPinned, logs=excluded.logs, archivedAt=excluded.archivedAt
        `).bind(
          String(p.id), p.n, String(p.tpl), p.un, p.am, p.s, p.memo, 
          p.isArchived || 0, p.isPinned || 0, p.logs || '[]', 
          p.archivedAt || null, p.createdAt
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 5. 新增或更新模板
      if (path === "/templates" && method === "POST") {
        const t = await request.json();
        if (!t.id) return new Response(JSON.stringify({ error: "Missing Template ID" }), { status: 400, headers: corsHeaders });

        await env.DB.prepare(`
          INSERT INTO templates (id, name, cat, steps) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
          name=excluded.name, cat=excluded.cat, steps=excluded.steps
        `).bind(
          String(t.id), 
          t.name, 
          t.cat || "默认分类", 
          typeof t.steps === 'string' ? t.steps : JSON.stringify(t.steps)
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 6. 删除模板
      if (path === "/templates/delete" && method === "POST") {
        const { id } = await request.json();
        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });
        
        await env.DB.prepare("DELETE FROM templates WHERE id = ?").bind(String(id)).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};
