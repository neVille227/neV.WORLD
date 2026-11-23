// Pages du portail neV.WORLD rendues côté serveur (aucune page statique).
// Aucun style ni script en ligne : la politique CSP du portail reste stricte.

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const FONTS = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap";

function accentClass(project) {
  return `accent-${escapeHtml(project.id)}`;
}

function layout({ title, description, bodyClass, content, path }) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07080c">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="/portal.css">
  <script src="/portal.js" defer></script>
</head>
<body class="${escapeHtml(bodyClass)}" data-path="${escapeHtml(path)}">
${content}
</body>
</html>`;
}

function header(active) {
  const link = (href, label, key) =>
    `<a href="${href}" class="nav-link${active === key ? " active" : ""}">${label}</a>`;
  return `<header class="site-header">
    <a class="brand" href="/explorer" aria-label="neV.WORLD, Explorer"><span class="brand-mark">neV<span>.</span></span><span class="brand-world">WORLD</span></a>
    <button class="menu-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="primary-nav"><span></span><span></span></button>
    <nav class="primary-nav" id="primary-nav" aria-label="Navigation principale">
      ${link("/", "Accueil", "home")}${link("/explorer", "Explorer", "explorer")}${link("/compte.html", "neV.ID", "id")}
    </nav>
    <div class="header-actions">
      <a class="account-link" href="/sign-in?redirect_url=%2Fexplorer"><span class="status-dot"></span> Se connecter</a>
      <a class="button button-primary button-small" href="/sign-up?redirect_url=%2Fexplorer">Créer mon compte <span aria-hidden="true">→</span></a>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <a class="brand footer-brand" href="/explorer"><span class="brand-mark">neV<span>.</span></span><span class="brand-world">WORLD</span></a>
    <p>Un écosystème en construction.</p>
    <span class="footer-copy">© <span id="current-year">2026</span> neV.WORLD</span>
  </footer>`;
}

export function renderIntro() {
  const content = `<canvas id="stars" aria-hidden="true"></canvas>
  <main class="intro-stage">
    <div class="logo-back" aria-hidden="true"><span>n</span><span>e</span><span>V</span><span class="dot">.</span></div>
    <div class="planet" aria-hidden="true">
      <div class="planet-ring ring-back"></div>
      <div class="planet-body"><div class="planet-surface"></div><div class="planet-clouds"></div><div class="planet-shade"></div></div>
      <div class="planet-ring ring-front"></div>
    </div>
    <h1 class="visually-hidden">neV.WORLD</h1>
    <p class="intro-tag">UN ÉCOSYSTÈME <span>·</span> PLUSIEURS AMBITIONS</p>
    <div class="intro-actions">
      <a class="explore-button" href="/explorer" id="explore-button"><span>Explorer</span><i aria-hidden="true">↓</i></a>
      <a class="intro-skip" href="/explorer">Passer l'animation</a>
    </div>
  </main>`;
  return layout({
    title: "neV.WORLD — Un écosystème, plusieurs ambitions",
    description: "neV.WORLD, le point de rencontre des projets de l'écosystème neV.",
    bodyClass: "page-intro",
    content,
    path: "/",
  });
}

function projectCard(project, position) {
  const id = escapeHtml(project.id);
  return `<article class="project-card ${accentClass(project)}" data-reveal data-i="${position}">
        <div class="card-glow" aria-hidden="true"></div>
        <div class="card-topline"><span class="project-index">${escapeHtml(project.index)} / ${escapeHtml(project.domain)}</span><span class="card-status status-${escapeHtml(project.status)}"><i></i> ${escapeHtml(project.statusLabel)}</span></div>
        ${project.logo ? `<div class="card-logo"><img src="${escapeHtml(project.logo)}" alt="Logo ${escapeHtml(project.name)}" loading="lazy" decoding="async"></div>` : `<div class="project-emblem"><span>${escapeHtml(project.emblem)}</span><i></i></div>`}
        <h3>${escapeHtml(project.name)}</h3>
        <p class="card-tagline">${escapeHtml(project.tagline)}</p>
        <p>${escapeHtml(project.description)}</p>
        <div class="card-bottom"><span class="card-category">${escapeHtml(project.category)}</span><a class="card-link" href="/projets/${encodeURIComponent(project.id)}" aria-label="Explorer ${escapeHtml(project.name)}">Explorer <span aria-hidden="true">→</span></a></div>
      </article>`;
}

export function renderExplorer(projects) {
  const main = projects.filter((p) => p.kind !== "module");
  const modules = projects.filter((p) => p.kind === "module");
  const cards = main.map((p, i) => projectCard(p, i)).join("\n      ");
  const moduleStrip = modules.map((m) => `<a class="module-strip ${accentClass(m)}" href="/projets/${encodeURIComponent(m.id)}" data-reveal>
        ${m.logo ? `<span class="module-logo"><img src="${escapeHtml(m.logo)}" alt="Logo ${escapeHtml(m.name)}" loading="lazy" decoding="async"></span>` : `<span class="module-emblem">${escapeHtml(m.emblem)}</span>`}
        <span class="module-text"><b>${escapeHtml(m.name)} — ${escapeHtml(m.domain)}</b><small>${escapeHtml(m.tagline)}</small></span>
        <span class="module-go" aria-hidden="true">→</span>
      </a>`).join("");
  const content = `${header("explorer")}
  <main>
    <section class="explorer-hero section-wrap">
      <div class="hero-orb" aria-hidden="true"></div>
      <div class="eyebrow" data-reveal><span class="eyebrow-line"></span> BIENVENUE DANS L'ÉCOSYSTÈME</div>
      <h1 data-reveal>Explorez<br><span>neV.WORLD.</span></h1>
      <p class="explorer-lead" data-reveal>Une identité commune, des univers singuliers. Choisissez un projet pour découvrir sa vocation, son état d'avancement et la façon de l'utiliser.</p>
      <a class="explore-cue" href="#projets" data-reveal><span class="cue-line"></span> DÉCOUVRIR LES PROJETS <span aria-hidden="true">↓</span></a>
    </section>
    <section class="explorer-projects section-wrap" id="projets">
      <div class="section-heading" data-reveal>
        <div><div class="eyebrow"><span class="eyebrow-line"></span> LES UNIVERS neV</div><h2>Chaque projet<br><span>a son propre espace.</span></h2></div>
        <p>Les ${main.length} projets de l'écosystème sont réunis ici, alignés. Un clic ouvre la page dédiée du projet.</p>
      </div>
      <div class="project-grid">
      ${cards}
      </div>
      ${moduleStrip}
    </section>
    <section class="explorer-note section-wrap" data-reveal>
      <span class="eyebrow"><span class="eyebrow-line"></span> L'ESPRIT neV.WORLD</span>
      <p>Des projets autonomes.<br><span>Une vision qui les relie.</span></p>
      <a href="/compte.html" class="text-link">Découvrir neV.ID <span>↗</span></a>
    </section>
  </main>
  ${footer()}`;
  return layout({
    title: "Explorer — neV.WORLD",
    description: "Explorez les projets qui composent l'écosystème neV.WORLD.",
    bodyClass: "page-explorer",
    content,
    path: "/explorer",
  });
}

function milestoneList(project) {
  return project.milestones.map((m, i) => `<li class="ms ms-${escapeHtml(m.state)}" data-reveal data-i="${i}"><span class="ms-dot"></span><span class="ms-label">${escapeHtml(m.label)}</span><span class="ms-state">${m.state === "done" ? "FAIT" : m.state === "current" ? "EN COURS" : "À VENIR"}</span></li>`).join("");
}

export function renderProject(project, projects) {
  const index = projects.findIndex((p) => p.id === project.id);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const action = project.url
    ? `<a class="button button-primary" href="${escapeHtml(project.url)}"${project.url.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(project.linkLabel)} <span aria-hidden="true">↗</span></a>`
    : `<span class="button button-ghost" aria-disabled="true">${escapeHtml(project.linkLabel)}</span>`;
  const paragraphs = project.about.map((t) => `<p>${escapeHtml(t)}</p>`).join("");
  const planned = project.planned.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  const steps = project.howto.map((t, i) => `<li data-reveal data-i="${i}"><span>${String(i + 1).padStart(2, "0")}</span><p>${escapeHtml(t)}</p></li>`).join("");
  const content = `${header("explorer")}
  <main class="${accentClass(project)}">
    <section class="project-hero">
      <div class="hero-orb" aria-hidden="true"></div>
      <a class="project-back" href="/explorer"><span aria-hidden="true">←</span> TOUS LES PROJETS</a>
      ${project.logo ? `<div class="hero-logo" data-parallax="0.18"><img src="${escapeHtml(project.logo)}" alt="Logo ${escapeHtml(project.name)}" decoding="async"></div>` : `<div class="project-hero-emblem" data-parallax="0.18"><span>${escapeHtml(project.emblem)}</span><i></i><b></b></div>`}
      <div class="eyebrow" data-reveal><span class="eyebrow-line"></span> ${escapeHtml(project.domain)} / ${escapeHtml(project.index)}</div>
      <h1 data-reveal>${escapeHtml(project.name)}</h1>
      <p class="project-tagline" data-reveal>${escapeHtml(project.tagline)}</p>
      <div class="project-chips" data-reveal><span class="card-status status-${escapeHtml(project.status)}"><i></i> ${escapeHtml(project.statusLabel)}</span><span class="chip">${escapeHtml(project.category)}</span></div>
      <div class="project-actions" data-reveal>${action}<a class="button button-outline" href="/explorer">Continuer l'exploration <span aria-hidden="true">→</span></a></div>
      <a class="scroll-cue" href="#apropos" aria-label="Voir la suite"><span></span></a>
    </section>
    <section class="detail-section section-wrap" id="apropos">
      <div class="detail-label" data-reveal>01 — CE QUE C'EST</div>
      <div class="detail-body big-text" data-reveal>${paragraphs}</div>
    </section>
    <section class="detail-section section-wrap">
      <div class="detail-label" data-reveal>02 — OÙ NOUS EN SOMMES</div>
      <ol class="milestones">${milestoneList(project)}</ol>
      <p class="honesty" data-reveal>Cet état est celui validé par le fondateur. Il ne présente comme disponible que ce qui l'est réellement.</p>
    </section>
    <section class="detail-section section-wrap">
      <div class="detail-label" data-reveal>03 — CE QUI EST PRÉVU</div>
      <ul class="planned" data-reveal>${planned}</ul>
    </section>
    <section class="detail-section section-wrap">
      <div class="detail-label" data-reveal>04 — COMMENT L'UTILISER</div>
      <ol class="steps">${steps}</ol>
    </section>
    <nav class="project-pager section-wrap" aria-label="Autres projets">
      <a href="/projets/${encodeURIComponent(prev.id)}" class="pager-link ${accentClass(prev)}"><small>← PRÉCÉDENT</small><b>${escapeHtml(prev.name)}</b></a>
      <a href="/projets/${encodeURIComponent(next.id)}" class="pager-link pager-next ${accentClass(next)}"><small>SUIVANT →</small><b>${escapeHtml(next.name)}</b></a>
    </nav>
  </main>
  ${footer()}`;
  return layout({
    title: `${project.name} — neV.WORLD`,
    description: project.description,
    bodyClass: "page-project",
    content,
    path: `/projets/${project.id}`,
  });
}
