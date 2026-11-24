(() => {
  const currentScript = document.currentScript;
  const systemOverviewUrl = new URL("System Overview/html & css files/index.html", currentScript.src);
  const topbar = document.querySelector(".main-area > .topbar");

  if (!topbar) return;

  topbar.innerHTML = `
    <button class="sidebar-toggle" type="button" aria-label="Collapse sidebar" aria-expanded="true" aria-controls="app-sidebar" title="Collapse sidebar">
      <i data-lucide="panel-left-close" aria-hidden="true"></i>
    </button>
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

  const appShell = document.querySelector(".app-shell");
  const sidebar = document.querySelector(".app-shell > .sidebar");
  const sidebarToggle = topbar.querySelector(".sidebar-toggle");
  const sidebarStorageKey = "vaps-sidebar-collapsed";
  const setSidebarCollapsed = (collapsed) => {
    appShell?.classList.toggle("sidebar-collapsed", collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    sidebarToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
    sidebarToggle.innerHTML = `<i data-lucide="${collapsed ? "panel-left-open" : "panel-left-close"}" aria-hidden="true"></i>`;
    if (window.lucide) window.lucide.createIcons({ root: sidebarToggle });
    try { localStorage.setItem(sidebarStorageKey, String(collapsed)); } catch {}
  };
  let savedSidebarState = false;
  try { savedSidebarState = localStorage.getItem(sidebarStorageKey) === "true"; } catch {}
  setSidebarCollapsed(savedSidebarState);
  sidebarToggle.addEventListener("click", () => {
    setSidebarCollapsed(!appShell?.classList.contains("sidebar-collapsed"));
  });
  sidebar?.setAttribute("id", "app-sidebar");
  sidebar?.querySelectorAll(".nav-item").forEach((item) => {
    const label = item.querySelector("span")?.textContent.trim();
    if (label) {
      item.setAttribute("aria-label", label);
      item.title = label;
    }
  });

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
