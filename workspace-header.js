(() => {
  const currentScript = document.currentScript;
  const systemOverviewUrl = new URL("System Overview/html & css files/index.html", currentScript.src);
  const topbar = document.querySelector(".main-area > .topbar");

  if (!topbar) return;

  topbar.innerHTML = `
    <label class="global-search">
      <i data-lucide="search" aria-hidden="true"></i>
      <input type="search" placeholder="Search pages, students, teachers, reports..." aria-label="Search pages, students, teachers, and reports" />
    </label>
    <div class="top-actions">
      <button class="top-pill" type="button" data-workspace-dialog="operation-tools" aria-haspopup="dialog">
        <i data-lucide="layout-grid" aria-hidden="true"></i><span>Modules</span>
      </button>
      <div class="intelligent-apps-dropdown">
        <button class="top-pill" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="intelligent-apps-menu">
          <i data-lucide="sparkles" aria-hidden="true"></i><span>Intelligent Apps</span><i data-lucide="chevron-down" class="tiny-chevron" aria-hidden="true"></i>
        </button>
        <div class="intelligent-apps-menu" id="intelligent-apps-menu" role="menu" aria-label="Intelligent Apps">
          <div class="intelligent-apps-menu-panel">
            <button type="button" role="menuitem">WhatsApp</button>
            <button type="button" role="menuitem">ChatGPT</button>
            <button type="button" role="menuitem">Language Translator</button>
            <button type="button" role="menuitem">Text-to-Speech</button>
            <button type="button" role="menuitem">PDF Converter</button>
            <button type="button" role="menuitem">Media Compressor</button>
            <button type="button" role="menuitem">360 Degree Tour</button>
          </div>
        </div>
      </div>
      <button class="top-pill" type="button" data-workspace-dialog="ai-edge" aria-haspopup="dialog">
        <i data-lucide="bot" aria-hidden="true"></i><span>AI Edge</span>
      </button>
      <button class="notification" type="button" aria-label="Notifications"><i data-lucide="bell" aria-hidden="true"></i><b></b></button>
      <div class="profile-menu-container">
        <button class="profile profile-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="profile-dropdown">
          <span class="avatar">T</span>
          <span class="profile-trigger-copy"><strong>TBHSADMIN</strong><small>Admin</small></span>
          <i data-lucide="chevron-down" aria-hidden="true"></i>
        </button>
        <div class="profile-dropdown" id="profile-dropdown" role="menu" aria-label="Identity profile">
          <section class="profile-identity"><span>IDENTITY PROFILE</span><strong>TBHSADMIN</strong><p>student@gmail.com</p><b>ADMIN</b></section>
          <button class="profile-signout" type="button" role="menuitem">Sign out <i data-lucide="log-out" aria-hidden="true"></i></button>
        </div>
      </div>
    </div>`;

  if (window.lucide) window.lucide.createIcons();

  const goToSystemDialog = (name) => {
    const destination = new URL(systemOverviewUrl);
    destination.searchParams.set("open", name);
    window.location.assign(destination.href);
  };

  topbar.querySelectorAll("[data-workspace-dialog]").forEach((button) => {
    button.addEventListener("click", () => goToSystemDialog(button.dataset.workspaceDialog));
  });

  const appDropdown = topbar.querySelector(".intelligent-apps-dropdown");
  const appTrigger = appDropdown.querySelector(".top-pill");
  const setAppsOpen = (open) => {
    appDropdown.dataset.open = String(open);
    appTrigger.setAttribute("aria-expanded", String(open));
  };
  appDropdown.addEventListener("pointerenter", () => setAppsOpen(true));
  appDropdown.addEventListener("pointerleave", () => setAppsOpen(false));
  appDropdown.addEventListener("focusin", () => setAppsOpen(true));
  appDropdown.addEventListener("focusout", (event) => {
    if (!appDropdown.contains(event.relatedTarget)) setAppsOpen(false);
  });
  appTrigger.addEventListener("click", () => setAppsOpen(appDropdown.dataset.open !== "true"));
  appDropdown.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setAppsOpen(false);
      appTrigger.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!appDropdown.contains(event.target)) setAppsOpen(false);
  });

  const profileMenu = topbar.querySelector(".profile-menu-container");
  const profileTrigger = profileMenu.querySelector(".profile-trigger");
  const setProfileOpen = (open) => {
    profileMenu.dataset.open = String(open);
    profileTrigger.setAttribute("aria-expanded", String(open));
  };
  profileTrigger.addEventListener("click", () => setProfileOpen(profileMenu.dataset.open !== "true"));
  profileMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setProfileOpen(false);
      profileTrigger.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!profileMenu.contains(event.target)) setProfileOpen(false);
  });
})();
