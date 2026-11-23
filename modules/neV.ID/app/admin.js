// Administration centrale neV.WORLD : statistiques, surveillance, journal.
// Aucune donnée personnelle de visiteur n'est stockée : ni IP, ni cookie, ni identifiant.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;
const PROBE_EVERY = 5 * 60 * 1000;
const HISTORY_LIMIT = 288; // 24 h à raison d'une mesure toutes les 5 min

export function createAdmin({ dataDir, loadProjects, selfBaseUrl }) {
  const startedAt = Date.now();
  const stats = { views: {}, hourly: {}, daily: {}, errors: 0, adminCalls: 0 };
  const health = new Map(); // id -> [{t, ok, ms, code}]
  const audit = [];
  let dirty = false;
  const statsFile = path.join(dataDir, "stats.json");

  async function restore() {
    try {
      const saved = JSON.parse(await readFile(statsFile, "utf-8"));
      Object.assign(stats, saved);
    } catch {
      /* première exécution ou disque éphémère : on repart de zéro */
    }
  }

  async function persist() {
    if (!dirty) return;
    dirty = false;
    try {
      await mkdir(dataDir, { recursive: true });
      await writeFile(statsFile, JSON.stringify(stats));
    } catch {
      /* stockage indisponible : les compteurs restent en mémoire */
    }
  }

  function prune() {
    const hourLimit = Date.now() - 48 * HOUR;
    for (const key of Object.keys(stats.hourly)) if (Number(key) < hourLimit) delete stats.hourly[key];
    const dayLimit = Date.now() - 31 * DAY;
    for (const key of Object.keys(stats.daily)) if (Number(key) < dayLimit) delete stats.daily[key];
  }

  function recordView(pathname) {
    const key = pathname.replace(/\/+$/, "") || "/";
    stats.views[key] = (stats.views[key] || 0) + 1;
    const hour = Math.floor(Date.now() / HOUR) * HOUR;
    const day = Math.floor(Date.now() / DAY) * DAY;
    stats.hourly[hour] = (stats.hourly[hour] || 0) + 1;
    stats.daily[day] = (stats.daily[day] || 0) + 1;
    dirty = true;
  }

  function recordError() {
    stats.errors += 1;
    dirty = true;
  }

  function log(who, action) {
    audit.unshift({ t: Date.now(), who, action });
    if (audit.length > 100) audit.pop();
  }

  async function probe(project) {
    const base = project.url && project.url.startsWith("http") ? project.url : project.kind === "module" ? selfBaseUrl() : null;
    if (!base) return { ok: null };
    const target = new URL("/api/health", base).href;
    const began = Date.now();
    try {
      const response = await fetch(target, { signal: AbortSignal.timeout(8000), redirect: "manual" });
      return { ok: response.ok, ms: Date.now() - began, code: response.status };
    } catch {
      return { ok: false, ms: Date.now() - began, code: 0 };
    }
  }

  async function probeAll() {
    let projects = [];
    try {
      projects = await loadProjects();
    } catch {
      return;
    }
    await Promise.all(projects.map(async (project) => {
      const result = await probe(project);
      if (result.ok === null) return;
      const list = health.get(project.id) || [];
      list.push({ t: Date.now(), ...result });
      while (list.length > HISTORY_LIMIT) list.shift();
      health.set(project.id, list);
    }));
  }

  function summarizeHealth(project) {
    const list = health.get(project.id) || [];
    if (!list.length) return { monitored: Boolean(project.url || project.kind === "module"), samples: 0 };
    const last = list[list.length - 1];
    const okCount = list.filter((x) => x.ok).length;
    const times = list.filter((x) => x.ok).map((x) => x.ms).sort((a, b) => a - b);
    const median = times.length ? times[Math.floor(times.length / 2)] : null;
    return {
      monitored: true,
      samples: list.length,
      up: last.ok,
      lastCheck: last.t,
      lastLatencyMs: last.ms,
      lastCode: last.code,
      uptimePercent: Math.round((okCount / list.length) * 1000) / 10,
      medianLatencyMs: median,
      spark: list.slice(-48).map((x) => (x.ok ? x.ms : -1)),
    };
  }

  function series(map, count, step, now) {
    const end = Math.floor(now / step) * step;
    return Array.from({ length: count }, (_, i) => {
      const t = end - (count - 1 - i) * step;
      return { t, n: map[t] || 0 };
    });
  }

  async function overview({ clerk, adminLabel }) {
    prune();
    const now = Date.now();
    const projects = await loadProjects();
    let users = null;
    if (clerk) {
      try {
        const total = await clerk.users.getCount();
        const recent = await clerk.users.getUserList({ limit: 5, orderBy: "-created_at" });
        users = {
          total,
          recent: (recent.data || []).map((u) => ({
            createdAt: u.createdAt,
            email: maskEmail(u.emailAddresses?.[0]?.emailAddress || ""),
          })),
        };
      } catch {
        users = { error: true };
      }
    }
    const hourly = series(stats.hourly, 24, HOUR, now);
    const daily = series(stats.daily, 14, DAY, now);
    const totalViews = Object.values(stats.views).reduce((a, b) => a + b, 0);
    log(adminLabel, "Consultation du tableau de bord");
    return {
      generatedAt: now,
      server: {
        uptimeSeconds: Math.round((now - startedAt) / 1000),
        node: process.version,
        memoryMb: Math.round(process.memoryUsage().rss / 1048576),
        statsPersistent: dataDir ? true : false,
      },
      traffic: {
        totalViews,
        last24h: hourly.reduce((a, b) => a + b.n, 0),
        last14d: daily.reduce((a, b) => a + b.n, 0),
        errors: stats.errors,
        hourly,
        daily,
        topPages: Object.entries(stats.views).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, n]) => ({ page, n })),
      },
      users,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
        status: p.status,
        statusLabel: p.statusLabel,
        url: p.url,
        accent: p.accent,
        milestones: p.milestones,
        health: summarizeHealth(p),
        views: stats.views[`/projets/${p.id}`] || 0,
      })),
      audit: audit.slice(0, 15).map((a) => ({ t: a.t, who: a.who, action: a.action })),
    };
  }

  restore().then(() => probeAll());
  setInterval(probeAll, PROBE_EVERY).unref();
  setInterval(persist, 30000).unref();

  return { recordView, recordError, overview, log, persist };
}

export function maskEmail(email) {
  const [name, domain] = String(email).split("@");
  if (!domain) return "—";
  return `${name.slice(0, 1)}•••@${domain}`;
}
