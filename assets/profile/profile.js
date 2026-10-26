(() => {
  "use strict";

  const root = document.documentElement;
  const themeButton = document.getElementById("theme-toggle");

  const readStoredTheme = () => {
    try {
      return localStorage.getItem("profile-theme");
    } catch {
      return null;
    }
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeButton) {
      themeButton.textContent = theme === "dark" ? "light" : "dark";
      themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    }
  };

  applyTheme(readStoredTheme() || "light");

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("profile-theme", next);
      } catch {
        /* ignore */
      }
    });
  }

  const clock = document.getElementById("clock");
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bishkek",
  });

  const tick = () => {
    if (!clock) return;
    const now = new Date();
    clock.textContent = timeFormatter.format(now) + " UTC+6";
    clock.dateTime = now.toISOString();
  };

  tick();
  window.setInterval(tick, 30000);

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const toast = document.getElementById("toast");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy");
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        showToast("email copied");
      } catch {
        window.location.href = "mailto:" + value;
      }
    });
  });

  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  let scrollQueued = false;

  const updateActiveSection = () => {
    scrollQueued = false;
    if (!sections.length) return;
    const marker = window.scrollY + 140;
    let active = sections[0];

    for (const section of sections) {
      if (section.getBoundingClientRect().top + window.scrollY <= marker) {
        active = section;
      }
    }

    if (window.scrollY <= 2) {
      active = sections[0];
    } else if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      active = sections[sections.length - 1];
    }

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === "#" + active.id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const queueScrollUpdate = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateActiveSection);
  };

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate);
  updateActiveSection();

  const languageColors = {
    Python: "#3572a5",
    JavaScript: "#e8d44d",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    "Jupyter Notebook": "#da5b0b",
    Shell: "#89e051",
    Dockerfile: "#384d54",
    SQL: "#e38c00",
  };

  const knownDescriptions = {
    "cellvit-distill": "Distillation experiments for CellViT — smaller students, same predictions.",
    "edu-kstu": "Coursework and notes from Kyrgyz State Technical University.",
    locallibrary: "Django local library app — models, auth, and admin.",
    "corzent.github.io": "The source for this site.",
  };

  const fallbackRepos = [
    {
      name: "cellvit-distill",
      html_url: "https://github.com/corzent/cellvit-distill",
      description: knownDescriptions["cellvit-distill"],
      language: "Python",
      stargazers_count: 0,
      updated_at: "",
    },
    {
      name: "edu-kstu",
      html_url: "https://github.com/corzent/edu-kstu",
      description: knownDescriptions["edu-kstu"],
      language: "Python",
      stargazers_count: 0,
      updated_at: "",
    },
    {
      name: "locallibrary",
      html_url: "https://github.com/corzent/locallibrary",
      description: knownDescriptions.locallibrary,
      language: "Python",
      stargazers_count: 0,
      updated_at: "",
    },
    {
      name: "corzent.github.io",
      html_url: "https://github.com/corzent/corzent.github.io",
      description: knownDescriptions["corzent.github.io"],
      language: "HTML",
      stargazers_count: 0,
      updated_at: "",
    },
  ];

  const cacheKey = "corzent-repos-v1";
  const cacheTtl = 1000 * 60 * 60 * 6;

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.repos) || Date.now() - parsed.at > cacheTtl) return null;
      return parsed.repos;
    } catch {
      return null;
    }
  };

  const writeCache = (repos) => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), repos }));
    } catch {
      /* ignore */
    }
  };

  const formatUpdated = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return "updated " + new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
  };

  const createRepoCard = (repo) => {
    const card = document.createElement("article");
    card.className = "repo";

    const top = document.createElement("div");
    top.className = "repo__top";

    const heading = document.createElement("h3");
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = repo.name;
    heading.appendChild(link);

    if (repo.homepage) {
      const home = document.createElement("a");
      home.href = repo.homepage;
      home.target = "_blank";
      home.rel = "noopener";
      home.setAttribute("aria-label", "Live site for " + repo.name);
      home.textContent = " ↗";
      heading.appendChild(home);
    }

    top.appendChild(heading);

    if (repo.stargazers_count > 0) {
      const stars = document.createElement("span");
      stars.className = "repo__stars";
      stars.textContent = "★ " + repo.stargazers_count;
      top.appendChild(stars);
    }

    card.appendChild(top);

    const description = document.createElement("p");
    description.className = "repo__desc";
    description.textContent =
      repo.description || knownDescriptions[repo.name] || "No description yet.";
    card.appendChild(description);

    const meta = document.createElement("div");
    meta.className = "repo__meta";

    if (repo.language) {
      const language = document.createElement("span");
      language.className = "lang";
      const dot = document.createElement("i");
      dot.style.setProperty("--dot", languageColors[repo.language] || "var(--muted)");
      language.appendChild(dot);
      language.appendChild(document.createTextNode(repo.language));
      meta.appendChild(language);
    }

    const updated = formatUpdated(repo.updated_at);
    if (updated) {
      const updatedNode = document.createElement("span");
      updatedNode.textContent = updated;
      meta.appendChild(updatedNode);
    }

    if (meta.childNodes.length) card.appendChild(meta);

    return card;
  };

  const renderRepos = (repos) => {
    const grid = document.getElementById("repo-grid");
    if (!grid) return;
    grid.innerHTML = "";
    grid.removeAttribute("aria-busy");

    if (!repos.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No public repositories to show yet.";
      grid.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    repos.forEach((repo) => fragment.appendChild(createRepoCard(repo)));
    grid.appendChild(fragment);
  };

  const loadRepos = async () => {
    const grid = document.getElementById("repo-grid");
    if (!grid) return;

    const cached = readCache();
    if (cached) {
      renderRepos(cached);
      return;
    }

    grid.setAttribute("aria-busy", "true");
    const user = grid.getAttribute("data-user") || "corzent";

    try {
      const response = await fetch(
        "https://api.github.com/users/" + encodeURIComponent(user) + "/repos?per_page=100&sort=updated",
        { headers: { Accept: "application/vnd.github+json" } }
      );

      if (!response.ok) throw new Error("GitHub API responded with " + response.status);

      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("Unexpected GitHub API payload");

      const repos = payload
        .filter((repo) => repo && !repo.fork && repo.name !== user)
        .sort((a, b) => {
          const stars = (b.stargazers_count || 0) - (a.stargazers_count || 0);
          if (stars !== 0) return stars;
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        })
        .slice(0, 6)
        .map((repo) => ({
          name: repo.name,
          html_url: repo.html_url,
          homepage: repo.homepage,
          description: repo.description,
          language: repo.language,
          stargazers_count: repo.stargazers_count || 0,
          updated_at: repo.updated_at,
        }));

      if (!repos.length) throw new Error("No repositories returned");

      writeCache(repos);
      renderRepos(repos);
    } catch (error) {
      renderRepos(fallbackRepos);
    }
  };

  loadRepos();
})();
