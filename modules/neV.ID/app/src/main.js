import "./style.css";

const app = document.querySelector("#app");
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

const WORLD_URL = "/";
// Seules ces origines peuvent recevoir l'utilisateur après connexion (anti « open redirect »).
const ALLOWED_RETURN_ORIGINS = [
  window.location.origin,
  "https://nev-world.onrender.com",
  "https://nev.world",
  "https://www.nev.world",
  ...(import.meta.env.DEV ? ["http://localhost:5173", "http://127.0.0.1:5173"] : []),
];

function safeReturnUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return ALLOWED_RETURN_ORIGINS.includes(url.origin) ? url.href : null;
  } catch {
    return null;
  }
}

function getReturnUrl() {
  const fromQuery = new URLSearchParams(window.location.search).get("redirect_url");
  const safe = fromQuery ? safeReturnUrl(fromQuery) : null;
  try {
    if (safe) sessionStorage.setItem("nevReturnUrl", safe);
    return safe || safeReturnUrl(sessionStorage.getItem("nevReturnUrl")) || null;
  } catch {
    return safe;
  }
}

const returnUrl = getReturnUrl();

const copy = {
  signIn: {
    eyebrow: "IDENTITÉ neV",
    title: "Heureux de vous revoir.",
    description: "Connectez-vous une seule fois pour retrouver votre espace au sein de neV.WORLD.",
  },
  signUp: {
    eyebrow: "REJOINDRE L’ÉCOSYSTÈME",
    title: "Créez votre identité neV.",
    description: "Un seul compte pour les applications qui composent neV.WORLD.",
  },
  profile: {
    eyebrow: "VOTRE ESPACE PERSONNEL",
    title: "Votre compte neV.",
    description: "Gérez vos informations de compte et les paramètres de sécurité de votre identité.",
  },
};

function renderSetupMessage() {
  app.innerHTML = `
    <div class="page-shell">
      <header class="topbar">
        <a class="brand" href="${returnUrl || WORLD_URL}" aria-label="Retour vers neV.WORLD">
          <span class="brand-mark">neV<span>.</span></span>
          <span class="brand-divider"></span>
          <span class="brand-label">IDENTITY</span>
        </a>
        <a class="back-link" href="${returnUrl || WORLD_URL}">Retour à neV.WORLD <span aria-hidden="true">↗</span></a>
      </header>
      <main class="setup-main">
        <div class="setup-mark">neV<span>.</span></div>
        <p class="eyebrow">MODULE neV.ID</p>
        <h1>Le compte commun<br /><span>se prépare.</span></h1>
        <p class="setup-copy">L’interface est en place, mais Clerk n’est pas encore relié à une instance de développement.</p>
        <section class="setup-card">
          <h2>Configuration nécessaire</h2>
          <ol>
            <li>Créer l’instance neV.WORLD dans le tableau de bord Clerk.</li>
            <li>Copier la clé publique dans <code>VITE_CLERK_PUBLISHABLE_KEY</code>.</li>
            <li>Définir <code>CLERK_SECRET_KEY</code> uniquement dans l’environnement serveur.</li>
            <li>Configurer <code>NEV_ID_AUTHORIZED_PARTIES</code> avec l’origine exacte de l’application.</li>
          </ol>
          <p class="security-note">Ne placez jamais la clé secrète dans le code frontend, dans un fichier commité ou dans une variable commençant par <code>VITE_</code>.</p>
        </section>
        <p class="setup-footnote">neV.ID · Module interne de neV.WORLD · Préversion technique</p>
      </main>
    </div>
  `;
}

function loadClerkUi(clerkDomain) {
  return new Promise((resolve, reject) => {
    if (window.__internal_ClerkUICtor) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.nevClerkUi = "true";
    script.onload = () => {
      if (window.__internal_ClerkUICtor) {
        resolve();
      } else {
        reject(new Error("Le module d’interface Clerk n’a pas été initialisé."));
      }
    };
    script.onerror = () => reject(new Error("Impossible de charger les composants d’authentification Clerk."));
    document.head.appendChild(script);
  });
}

function getClerkDomain(key) {
  const encodedDomain = key.split("_")[2];

  if (!encodedDomain) {
    throw new Error("La clé publique Clerk semble incomplète.");
  }

  try {
    return atob(encodedDomain).slice(0, -1);
  } catch {
    throw new Error("La clé publique Clerk n’a pas un format reconnu.");
  }
}

function renderPage(page, clerk) {
  const pageCopy = copy[page];
  const isProfile = page === "profile";

  app.innerHTML = `
    <div class="page-shell">
      <header class="topbar">
        <a class="brand" href="${returnUrl || WORLD_URL}" aria-label="Retour vers neV.WORLD">
          <span class="brand-mark">neV<span>.</span></span>
          <span class="brand-divider"></span>
          <span class="brand-label">IDENTITY</span>
        </a>
        <nav class="top-nav" aria-label="Navigation du compte">
          ${isProfile
            ? '<a class="nav-link active" href="/profile">Mon compte</a><button class="sign-out-button" id="sign-out" type="button">Déconnexion</button>'
            : '<a class="nav-link" href="/sign-in">Connexion</a><a class="nav-link" href="/sign-up">Inscription</a>'}
          <a class="back-link" href="${returnUrl || WORLD_URL}">neV.WORLD <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main class="auth-layout ${isProfile ? "profile-layout" : ""}">
        <section class="intro-panel">
          <p class="eyebrow"><span class="eyebrow-mark"></span>${pageCopy.eyebrow}</p>
          <h1>${pageCopy.title.split(" ").slice(0, -1).join(" ")} <span>${pageCopy.title.split(" ").slice(-1)[0]}</span></h1>
          <p class="intro-copy">${pageCopy.description}</p>
          <div class="ecosystem-note">
            <span class="note-icon">neV.</span>
            <span><strong>Un seul compte.</strong><br />Plusieurs projets. Une identité commune.</span>
          </div>
          ${isProfile ? '<p class="server-status" id="server-status" role="status">Vérification de la session côté serveur…</p>' : ""}
        </section>

        <section class="auth-panel" aria-label="${isProfile ? "Gestion du compte" : page === "signIn" ? "Connexion" : "Inscription"}">
          <div class="panel-heading">
            <span class="panel-kicker">${isProfile ? "PARAMÈTRES DU COMPTE" : "ESPACE SÉCURISÉ"}</span>
            <span class="panel-indicator"><i></i> neV.ID</span>
          </div>
          <div id="clerk-component" class="clerk-mount"></div>
          <div class="panel-footer">Protégé par Clerk · neV.WORLD</div>
        </section>
      </main>

      <footer class="site-footer">
        <span>© ${new Date().getFullYear()} neV.WORLD</span>
        <span>IDENTITÉ · CONFIANCE · CONTINUITÉ</span>
      </footer>
    </div>
  `;

  const mountPoint = document.querySelector("#clerk-component");

  if (page === "signIn") {
    clerk.mountSignIn(mountPoint, returnUrl ? { forceRedirectUrl: returnUrl, signUpUrl: "/sign-up" } : {});
  } else if (page === "signUp") {
    clerk.mountSignUp(mountPoint, returnUrl ? { forceRedirectUrl: returnUrl, signInUrl: "/sign-in" } : {});
  } else {
    clerk.mountUserProfile(mountPoint);
    verifyServerSession(clerk);

    const signOutButton = document.querySelector("#sign-out");
    signOutButton?.addEventListener("click", async () => {
      signOutButton.disabled = true;
      signOutButton.textContent = "Déconnexion…";
      try {
        await clerk.signOut({ redirectUrl: "/sign-in" });
      } catch (error) {
        console.error("neV.ID sign-out failed:", error);
        signOutButton.disabled = false;
        signOutButton.textContent = "Réessayer";
      }
    });
  }
}

async function verifyServerSession(clerk) {
  const statusElement = document.querySelector("#server-status");
  if (!statusElement) return;

  try {
    const sessionToken = await clerk.session?.getToken();

    if (!sessionToken) {
      statusElement.textContent = "Aucun jeton de session actif n’a été fourni.";
      statusElement.classList.add("is-pending");
      return;
    }

    const response = await fetch("/api/me", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.authenticated) {
      statusElement.textContent = "Session vérifiée par le backend neV.ID.";
      statusElement.classList.add("is-success");
      return;
    }

    if (response.status === 503) {
      statusElement.textContent = "Le serveur d’authentification attend encore sa configuration Clerk.";
      statusElement.classList.add("is-pending");
      return;
    }

    statusElement.textContent = "La session n’a pas encore été confirmée par le backend.";
    statusElement.classList.add("is-pending");
  } catch {
    statusElement.textContent = "Le service de vérification n’est pas joignable pour le moment.";
    statusElement.classList.add("is-pending");
  }
}

async function start() {
  if (!publishableKey) {
    renderSetupMessage();
    return;
  }

  const [{ Clerk }, { frFR }] = await Promise.all([
    import("@clerk/clerk-js"),
    import("@clerk/localizations"),
  ]);

  const clerkDomain = getClerkDomain(publishableKey);
  await loadClerkUi(clerkDomain);

  const clerk = new Clerk(publishableKey);
  await clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    localization: frFR,
    appearance: {
      variables: {
        colorPrimary: "#E53945",
        colorBackground: "#111318",
        colorForeground: "#F5F5F7",
        colorInput: "#191B23",
        colorBorder: "rgba(255,255,255,0.12)",
        borderRadius: "0.65rem",
      },
    },
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    signInFallbackRedirectUrl: "/profile",
    signUpFallbackRedirectUrl: "/profile",
    afterSignOutUrl: "/sign-in",
    allowedRedirectOrigins: [window.location.origin, ...ALLOWED_RETURN_ORIGINS],
  });

  const requestedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = requestedPath === "/sign-up"
    ? "signUp"
    : requestedPath === "/profile"
      ? "profile"
      : "signIn";

  if (clerk.isSignedIn && page !== "profile") {
    window.location.replace(returnUrl || "/profile");
    return;
  }

  if (!clerk.isSignedIn && page === "profile") {
    window.location.replace("/sign-in");
    return;
  }

  renderPage(page, clerk);
}

start().catch((error) => {
  console.error("neV.ID startup error:", error);
  app.innerHTML = `
    <main class="error-screen">
      <div class="setup-mark">neV<span>.</span></div>
      <p class="eyebrow">NEV.ID · INITIALISATION</p>
      <h1>Impossible de démarrer<br /><span>le service de compte.</span></h1>
      <p id="startup-error"></p>
      <a class="button-link" href="/">Réessayer</a>
    </main>
  `;
  const errorMessage = document.querySelector("#startup-error");
  if (errorMessage) {
    errorMessage.textContent = error instanceof Error
      ? error.message
      : "Une erreur inattendue est survenue.";
  }
});
