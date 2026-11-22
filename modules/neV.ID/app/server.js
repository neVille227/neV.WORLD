import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClerkClient } from "@clerk/backend";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const buildDirectory = path.join(currentDirectory, "dist");
// Le portail neV.WORLD (fichiers statiques à la racine du dépôt) est servi sur la même adresse que neV.ID.
const portalDirectory = path.resolve(currentDirectory, "../../..");
const portalFiles = {
  "/": "index.html",
  "/index.html": "index.html",
  "/explorer": "explorer.html",
  "/explorer/": "explorer.html",
  "/explorer.html": "explorer.html",
  "/compte.html": "compte.html",
  "/style.css": "style.css",
  "/script.js": "script.js",
};
const port = Number(process.env.PORT) || 3000;

const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

const authorizedParties = (process.env.NEV_ID_AUTHORIZED_PARTIES || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const clerkClient =
  publishableKey && secretKey
    ? createClerkClient({ publishableKey, secretKey })
    : null;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
};

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function sendJson(response, statusCode, payload) {
  setSecurityHeaders(response);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function getSingleHeader(incomingRequest, name) {
  const value = incomingRequest.headers[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function toWebRequest(incomingRequest) {
  const host =
    getSingleHeader(incomingRequest, "x-forwarded-host") ||
    getSingleHeader(incomingRequest, "host");

  if (!host) {
    throw new Error("Missing host header on authentication request.");
  }

  const forwardedProto =
    getSingleHeader(incomingRequest, "x-forwarded-proto") ||
    (incomingRequest.socket?.encrypted ? "https" : "http");
  const protocol = forwardedProto.split(",")[0].trim().toLowerCase();

  if (protocol !== "http" && protocol !== "https") {
    throw new Error("Invalid forwarded protocol on authentication request.");
  }

  const headers = new Headers();
  const forwardedHeaders = [
    "accept",
    "authorization",
    "cookie",
    "host",
    "origin",
    "referer",
    "sec-fetch-dest",
    "user-agent",
    "x-forwarded-host",
    "x-forwarded-proto",
  ];

  for (const headerName of forwardedHeaders) {
    const headerValue = getSingleHeader(incomingRequest, headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  // Clerk uses these request headers to validate the signed session and
  // determine whether a browser handshake is required.
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (!headers.has("host")) headers.set("host", host);
  if (!headers.has("x-forwarded-host")) headers.set("x-forwarded-host", host);
  if (!headers.has("x-forwarded-proto")) headers.set("x-forwarded-proto", protocol);
  if (!headers.has("sec-fetch-dest")) headers.set("sec-fetch-dest", "empty");

  const requestUrl = new URL(incomingRequest.url || "/api/me", `${protocol}://${host}`);
  return new Request(requestUrl, {
    method: incomingRequest.method || "POST",
    headers,
  });
}

async function handleMe(request, response) {
  if (!clerkClient) {
    sendJson(response, 503, {
      error: "AUTH_NOT_CONFIGURED",
      message: "Le service d’authentification n’est pas encore configuré sur le serveur.",
    });
    return;
  }

  if (authorizedParties.length === 0) {
    sendJson(response, 503, {
      error: "AUTHORIZED_PARTIES_MISSING",
      message: "La liste des origines autorisées doit être configurée côté serveur.",
    });
    return;
  }

  try {
    const authState = await clerkClient.authenticateRequest(toWebRequest(request), {
      authorizedParties,
    });

    if (!authState.isAuthenticated) {
      sendJson(response, 401, {
        error: "UNAUTHENTICATED",
        message: "Une session neV.ID valide est nécessaire.",
      });
      return;
    }

    const auth = authState.toAuth();
    sendJson(response, 200, {
      authenticated: true,
      userId: auth.userId,
      sessionId: auth.sessionId,
    });
  } catch (error) {
    // Ne jamais renvoyer les détails internes de Clerk au navigateur.
    console.error("neV.ID authentication check failed:", error?.name || "UnknownError");
    sendJson(response, 401, {
      error: "SESSION_NOT_VERIFIED",
      message: "La session n’a pas pu être vérifiée.",
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadProjects() {
  return JSON.parse(await readFile(path.join(portalDirectory, "projects.json"), "utf-8"));
}

// Rendu côté serveur des cartes projets à partir de projects.json.
function renderProjectCards(projects) {
  return projects.map((p) => {
    const id = escapeHtml(p.id);
    return '<article class="project-card ' + id + '-card">' +
      '<div class="card-topline"><span class="project-index">' + escapeHtml(p.index) + ' / ' + escapeHtml(p.domain) + '</span><span class="card-status status-' + escapeHtml(p.status) + '"><i></i> ' + escapeHtml(p.statusLabel) + '</span></div>' +
      '<div class="project-emblem emblem-' + id + '"><span>' + escapeHtml(p.emblem) + '</span><i></i></div>' +
      '<h3>' + escapeHtml(p.name) + '</h3>' +
      '<p>' + escapeHtml(p.description) + '</p>' +
      '<div class="card-bottom"><span class="card-category">' + escapeHtml(p.category) + '</span><a class="card-link" href="/projets/' + encodeURIComponent(p.id) + '">Explorer <span>↗</span></a></div>' +
      '</article>';
  }).join("\n\n");
}
function renderProjectPage(project) {
  const externalAction = project.url
    ? `<a class="button button-primary" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">Accéder au projet <span aria-hidden="true">↗</span></a>`
    : `<span class="button button-outline" aria-disabled="true">${escapeHtml(project.linkLabel)}</span>`;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#08090d">
  <meta name="description" content="${escapeHtml(project.description)}">
  <title>${escapeHtml(project.name)} — neV.WORLD</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css"><script src="/script.js" defer></script>
</head>
<body class="explorer-page">
  <header class="site-header">
    <a class="brand" href="/explorer" aria-label="neV.WORLD, Explorer"><span class="brand-mark">neV<span>.</span></span><span class="brand-world">WORLD</span></a>
    <button class="menu-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="primary-nav"><span></span><span></span></button>
    <nav class="primary-nav" id="primary-nav" aria-label="Navigation principale"><a href="/explorer" class="nav-link">Explorer</a><a href="/compte.html" class="nav-link">neV.ID</a></nav>
    <div class="header-actions"><a class="button button-outline button-small" href="/explorer">Retour à Explorer <span aria-hidden="true">←</span></a></div>
  </header>
  <main>
    <section class="project-detail section-wrap">
      <a class="project-back" href="/explorer"><span aria-hidden="true">←</span> TOUS LES PROJETS</a>
      <div class="project-detail-emblem">${escapeHtml(project.emblem)}</div>
      <div class="eyebrow" style="margin-top:34px"><span class="eyebrow-line"></span> ${escapeHtml(project.domain)} / ${escapeHtml(project.index)}</div>
      <h1>${escapeHtml(project.name)}<br><span>Un univers à part entière.</span></h1>
      <p class="project-detail-lead">${escapeHtml(project.description)}</p>
      <div class="project-detail-meta">
        <span>CATÉGORIE — ${escapeHtml(project.category)}</span>
        <span>ÉTAT — ${escapeHtml(project.statusLabel)}</span>
      </div>
      <div class="project-detail-actions">${externalAction}<a class="button button-outline" href="/explorer">Continuer l'exploration <span aria-hidden="true">→</span></a></div>
    </section>
  </main>
  <footer class="site-footer"><a class="brand footer-brand" href="/explorer"><span class="brand-mark">neV<span>.</span></span><span class="brand-world">WORLD</span></a><p>Un écosystème en construction.</p><span class="footer-copy">© <span id="current-year">2026</span> neV.WORLD</span></footer>
</body>
</html>`;
}
async function servePortal(request, response, fileName) {
  try {
    let body = await readFile(path.join(portalDirectory, fileName));
    if (fileName === "index.html" || fileName === "explorer.html") {
      const cards = renderProjectCards(await loadProjects());
      const html = body.toString("utf-8").replace(
        /<!--projects:start-->[\s\S]*?<!--projects:end-->/,
        () => cards,
      );
      body = Buffer.from(html, "utf-8");
    }
    const contentType = mimeTypes[path.extname(fileName).toLowerCase()] || "application/octet-stream";
    setSecurityHeaders(response);
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": fileName.endsWith(".html") ? "no-cache" : "public, max-age=3600",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    sendJson(response, 404, { error: "NOT_FOUND" });
  }
}

async function serveStatic(request, response, pathname) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: "INVALID_PATH" });
    return;
  }

  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = path.resolve(buildDirectory, `.${requestedPath}`);

  if (filePath !== buildDirectory && !filePath.startsWith(buildDirectory + path.sep)) {
    sendJson(response, 403, { error: "FORBIDDEN" });
    return;
  }

  let targetPath = filePath;

  try {
    const fileInfo = await stat(targetPath);
    if (fileInfo.isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
  } catch {
    if (path.extname(decodedPath)) {
      sendJson(response, 404, { error: "NOT_FOUND" });
      return;
    }
    targetPath = path.join(buildDirectory, "index.html");
  }

  try {
    const body = await readFile(targetPath);
    const contentType = mimeTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream";

    setSecurityHeaders(response);
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": targetPath.endsWith("index.html") ? "no-cache" : "public, max-age=3600",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    sendJson(response, 503, {
      error: "APP_NOT_BUILT",
      message: "L’application neV.ID n’a pas encore été compilée. Lancez npm run build.",
    });
  }
}

const server = createServer(async (request, response) => {
  const method = request.method || "GET";
  const requestUrl = new URL(request.url || "/", "http://localhost");

  if (requestUrl.pathname === "/api/health") {
    if (method !== "GET" && method !== "HEAD") {
      sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
      return;
    }

    sendJson(response, 200, {
      status: "ok",
      service: "neV.ID",
      authenticationConfigured: Boolean(clerkClient),
    });
    return;
  }

  if (requestUrl.pathname === "/api/projects") {
    if (method !== "GET" && method !== "HEAD") {
      sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
      return;
    }
    try {
      sendJson(response, 200, { projects: await loadProjects() });
    } catch {
      sendJson(response, 500, { error: "PROJECTS_UNAVAILABLE" });
    }
    return;
  }

  if (requestUrl.pathname === "/api/me") {
    // POST ensures browsers send the Origin header that Clerk validates.
    if (method !== "POST") {
      sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
      return;
    }

    await handleMe(request, response);
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    sendJson(response, 404, { error: "API_ROUTE_NOT_FOUND" });
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    sendJson(response, 405, { error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const projectMatch = requestUrl.pathname.match(/^\/projets\/([a-z0-9-]+)\/?$/i);
  if (projectMatch) {
    try {
      const projects = await loadProjects();
      const project = projects.find((item) => item.id === projectMatch[1]);
      if (!project) { sendJson(response, 404, { error: "PROJECT_NOT_FOUND" }); return; }
      const html = renderProjectPage(project);
      setSecurityHeaders(response);
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      response.end(method === "HEAD" ? undefined : html);
    } catch {
      sendJson(response, 500, { error: "PROJECT_UNAVAILABLE" });
    }
    return;
  }

  const portalFile = portalFiles[requestUrl.pathname];
  if (portalFile) {
    await servePortal(request, response, portalFile);
    return;
  }

  await serveStatic(request, response, requestUrl.pathname);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`neV.ID server listening on port ${port}`);
});
