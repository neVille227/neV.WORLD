// Tableau de bord d'administration centrale (accès réservé, vérifié côté serveur).
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = new Intl.NumberFormat("fr-FR");
const fmtTime = (t) => new Date(t).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const fmtUptime = (s) => (s >= 86400 ? `${Math.floor(s / 86400)} j ${Math.floor((s % 86400) / 3600)} h` : s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : `${Math.floor(s / 60)} min`);

function bars(series, label) {
  const w = 600, h = 140, pad = 18, max = Math.max(1, ...series.map((x) => x.n));
  const bw = (w - pad * 2) / series.length;
  const rects = series.map((x, i) => {
    const bh = Math.max(2, (x.n / max) * (h - pad * 2));
    return `<rect x="${(pad + i * bw + 2).toFixed(1)}" y="${(h - pad - bh).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" class="adm-bar"><title>${esc(fmtTime(x.t))} — ${x.n}</title></rect>`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="adm-chart" role="img" aria-label="${esc(label)}"><line x1="${pad}" x2="${w - pad}" y1="${h - pad}" y2="${h - pad}" class="adm-axis"/>${rects}<text x="${pad}" y="12" class="adm-axis-label">max ${max}</text></svg>`;
}

function spark(values) {
  if (!values || values.length < 2) return '<span class="adm-muted">—</span>';
  const w = 120, h = 30, ok = values.filter((v) => v >= 0), max = Math.max(1, ...ok);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${v < 0 ? h - 1 : (h - 3 - (v / max) * (h - 8)).toFixed(1)}`).join(" ");
  const down = values.some((v) => v < 0);
  return `<svg viewBox="0 0 ${w} ${h}" class="adm-spark${down ? " has-down" : ""}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
}

function projectRow(p) {
  const h = p.health || {};
  const done = p.milestones.filter((m) => m.state === "done").length;
  const pct = Math.round((done / p.milestones.length) * 100);
  let state;
  if (!h.monitored) state = '<span class="adm-pill adm-pill-off">Non déployé</span>';
  else if (!h.samples) state = '<span class="adm-pill adm-pill-wait">Mesure en cours</span>';
  else state = h.up ? '<span class="adm-pill adm-pill-ok">En ligne</span>' : '<span class="adm-pill adm-pill-bad">Hors ligne</span>';
  return `<article class="adm-project" data-accent="${esc(p.accent)}">
    <header><span class="adm-dot"></span><h3>${esc(p.name)}</h3>${state}</header>
    <dl>
      <div><dt>Statut annoncé</dt><dd>${esc(p.statusLabel)}</dd></div>
      <div><dt>Disponibilité</dt><dd>${h.uptimePercent != null ? h.uptimePercent + " %" : "—"}</dd></div>
      <div><dt>Latence (médiane)</dt><dd>${h.medianLatencyMs != null ? h.medianLatencyMs + " ms" : "—"}</dd></div>
      <div><dt>Visites de la page</dt><dd>${nf.format(p.views)}</dd></div>
    </dl>
    <div class="adm-spark-row">${spark(h.spark)}<small>${h.samples ? h.samples + " mesures" : ""}</small></div>
    <div class="adm-progress" title="${done}/${p.milestones.length} étapes"><span class="adm-progress-bar" data-w="${pct}"></span></div>
    <small class="adm-muted">Avancement : ${done}/${p.milestones.length} étapes validées</small>
  </article>`;
}

function render(root, d) {
  const monitored = d.projects.filter((p) => p.health.monitored && p.health.samples);
  const up = monitored.filter((p) => p.health.up).length;
  const avgUptime = monitored.length ? Math.round((monitored.reduce((a, p) => a + p.health.uptimePercent, 0) / monitored.length) * 10) / 10 : null;
  const kpi = (label, value, note = "") => `<div class="adm-kpi"><small>${label}</small><b>${value}</b>${note ? `<span>${note}</span>` : ""}</div>`;
  root.innerHTML = `
    <div class="adm-wrap">
      <header class="adm-top">
        <div><p class="adm-eyebrow">DIRECTION CENTRALE</p><h1>Administration <span>neV.WORLD</span></h1></div>
        <div class="adm-actions"><button id="adm-refresh" class="adm-btn" type="button">Actualiser</button><a class="adm-btn adm-btn-ghost" href="/explorer">Voir le site</a></div>
      </header>
      <section class="adm-kpis">
        ${kpi("Visites (24 h)", nf.format(d.traffic.last24h))}
        ${kpi("Visites (14 jours)", nf.format(d.traffic.last14d))}
        ${kpi("Comptes neV.ID", d.users && d.users.total != null ? nf.format(d.users.total) : "—")}
        ${kpi("Projets en ligne", `${up}/${monitored.length}`, "surveillés")}
        ${kpi("Disponibilité moyenne", avgUptime != null ? avgUptime + " %" : "—", "sur la période mesurée")}
        ${kpi("Erreurs serveur", nf.format(d.traffic.errors))}
      </section>
      <section class="adm-grid-2">
        <div class="adm-card"><h2>Trafic — 24 dernières heures</h2>${bars(d.traffic.hourly, "Visites par heure")}</div>
        <div class="adm-card"><h2>Trafic — 14 derniers jours</h2>${bars(d.traffic.daily, "Visites par jour")}</div>
      </section>
      <section><h2 class="adm-h2">Projets</h2><div class="adm-projects">${d.projects.map(projectRow).join("")}</div></section>
      <section class="adm-grid-3">
        <div class="adm-card"><h2>Pages les plus vues</h2>${d.traffic.topPages.length ? `<ol class="adm-list">${d.traffic.topPages.map((x) => `<li><span>${esc(x.page)}</span><b>${nf.format(x.n)}</b></li>`).join("")}</ol>` : '<p class="adm-muted">Aucune visite enregistrée depuis le démarrage.</p>'}</div>
        <div class="adm-card"><h2>Dernières inscriptions</h2>${d.users && d.users.recent && d.users.recent.length ? `<ol class="adm-list">${d.users.recent.map((u) => `<li><span>${esc(u.email)}</span><b>${esc(fmtTime(u.createdAt))}</b></li>`).join("")}</ol>` : '<p class="adm-muted">Aucune inscription à afficher.</p>'}</div>
        <div class="adm-card"><h2>Serveur</h2><ul class="adm-list adm-kv"><li><span>En marche depuis</span><b>${esc(fmtUptime(d.server.uptimeSeconds))}</b></li><li><span>Node.js</span><b>${esc(d.server.node)}</b></li><li><span>Mémoire</span><b>${d.server.memoryMb} Mo</b></li><li><span>Mesures</span><b>toutes les 5 min</b></li></ul></div>
      </section>
      <section class="adm-card"><h2>Journal d'accès à l'administration</h2>${d.audit.length ? `<ol class="adm-list">${d.audit.map((a) => `<li><span>${esc(a.action)} — ${esc(a.who)}</span><b>${esc(fmtTime(a.t))}</b></li>`).join("")}</ol>` : '<p class="adm-muted">Aucune entrée.</p>'}</section>
      <p class="adm-foot">Ces statistiques sont comptées sur le serveur, sans adresse IP ni cookie de suivi. Elles repartent de zéro si le serveur n'a pas de disque persistant. Dernière mise à jour : ${esc(fmtTime(d.generatedAt))}.</p>
    </div>`;
  root.querySelectorAll("[data-accent]").forEach((el) => { el.style.setProperty("--accent", el.dataset.accent); });
  root.querySelectorAll(".adm-progress-bar").forEach((el) => { el.style.width = `${el.dataset.w}%`; });
}

function message(root, title, text) {
  root.innerHTML = `<main class="error-screen"><div class="setup-mark">neV<span>.</span></div><p class="eyebrow">ADMINISTRATION</p><h1>${esc(title)}</h1><p>${esc(text)}</p><a class="button-link" href="/explorer">Retour au site</a></main>`;
}

export async function renderAdmin(root, clerk) {
  async function load() {
    const token = await clerk.session?.getToken();
    const response = await fetch("/api/admin/overview", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (response.status === 403) return message(root, "Accès refusé", "Ce compte n'est pas autorisé à utiliser l'administration."), null;
    if (response.status === 503) return message(root, "Administration non configurée", "Aucun administrateur n'est encore configuré sur le serveur."), null;
    if (!response.ok) return message(root, "Service indisponible", "Le tableau de bord n'a pas pu être chargé. Réessayez dans un instant."), null;
    return response.json();
  }
  async function refresh() {
    const data = await load();
    if (!data) return false;
    render(root, data);
    root.querySelector("#adm-refresh")?.addEventListener("click", refresh);
    return true;
  }
  if (await refresh()) setInterval(refresh, 60000);
}
