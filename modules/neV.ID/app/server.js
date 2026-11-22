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

async function servePortal(request, response, fileName) {
  try {
    const body = await readFile(path.join(portalDirectory, fileName));
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
