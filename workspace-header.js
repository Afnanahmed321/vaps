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
      <button class="top-pill header-modules-trigger" type="button" data-workspace-dialog="operation-tools" aria-haspopup="dialog">
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
      <button class="top-pill" id="ai-edge-trigger" type="button" data-workspace-dialog="ai-edge" aria-haspopup="dialog">
        <i data-lucide="bot" aria-hidden="true"></i><span>AI Edge</span>
      </button>
      <button class="notification" type="button" aria-label="View notifications"><i data-lucide="bell" aria-hidden="true"></i><b hidden></b></button>
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
    if (collapsed) {
      const modulesToggle = sidebar?.querySelector(".sidebar-modules-toggle");
      const modules = sidebar?.querySelector("#sidebar-modules");
      if (modulesToggle && modules) {
        modulesToggle.setAttribute("aria-expanded", "false");
        modules.hidden = true;
      }
    }
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

  const moduleGroups = [
    { key: "pre-configuration", title: "Pre Configuration", icon: "settings-2", path: "/modules/preconfiguration/" },
    { key: "preadmission", title: "Preadmission", icon: "user-round-search", path: "/modules/preadmission/" },
    { key: "admission", title: "Admission", icon: "graduation-cap", path: "/modules/admission/" },
    { key: "fees", title: "Fees", icon: "wallet" },
    { key: "exam", title: "Exam", icon: "book-open-check" },
    { key: "hrms", title: "HRMS", icon: "users-round" },
    { key: "front-office", title: "Front Office", icon: "panels-top-left" },
    { key: "leave-management", title: "Leave Management", icon: "mail" },
    { key: "upload", title: "Upload", icon: "upload" },
    { key: "time-table", title: "Time Table", icon: "calendar-days" },
    { key: "coe", title: "COE", icon: "calendar-clock" },
    { key: "birthday", title: "Birthday", icon: "cake" },
    { key: "sports", title: "Sports", icon: "trophy" },
    { key: "online-exam", title: "Online Exam", icon: "monitor" },
    { key: "library", title: "Library", icon: "book-open" },
    { key: "transport", title: "Transport", icon: "bus" },
    { key: "lms", title: "LMS", icon: "presentation" },
    { key: "ai-edge", title: "AI Edge", icon: "sparkles" }
  ];
  const sidebarNav = sidebar?.querySelector(".side-nav");
  let sidebarModulesToggle;
  let sidebarModules;

  if (sidebarNav && !sidebarNav.querySelector(".sidebar-modules-toggle")) {
    const currentPath = window.location.pathname.toLocaleLowerCase();
    const activeModule = moduleGroups.find((group) => group.path && currentPath.includes(group.path));
    sidebarModulesToggle = document.createElement("button");
    sidebarModulesToggle.className = "nav-item sidebar-modules-toggle";
    sidebarModulesToggle.type = "button";
    sidebarModulesToggle.setAttribute("aria-expanded", String(Boolean(activeModule)));
    sidebarModulesToggle.setAttribute("aria-controls", "sidebar-modules");
    sidebarModulesToggle.innerHTML = '<i data-lucide="layout-grid" aria-hidden="true"></i><span>Modules</span><i class="chevron" data-lucide="chevron-down" aria-hidden="true"></i>';

    sidebarModules = document.createElement("div");
    sidebarModules.className = "sidebar-modules";
    sidebarModules.id = "sidebar-modules";
    sidebarModules.hidden = !activeModule;
    moduleGroups.forEach((group) => {
      const link = document.createElement("a");
      link.className = "sidebar-module-button";
      link.href = new URL(`#${group.key}`, systemOverviewUrl).href;
      link.dataset.workspacePage = group.key;
      link.innerHTML = `<span class="module-nav-icon"><i data-lucide="${group.icon}" aria-hidden="true"></i></span><span class="module-nav-copy"><strong>${group.title}</strong></span>`;
      if (group === activeModule) link.setAttribute("aria-current", "page");
      sidebarModules.append(link);
    });
    sidebarNav.append(sidebarModulesToggle, sidebarModules);

    const setModulesOpen = (open) => {
      sidebarModulesToggle.setAttribute("aria-expanded", String(open));
      sidebarModules.hidden = !open;
    };
    sidebarModulesToggle.addEventListener("click", () => {
      const collapsed = appShell.classList.contains("sidebar-collapsed")
        && !appShell.hasAttribute("data-mobile-menu-open");
      if (collapsed) setSidebarCollapsed(false);
      setModulesOpen(collapsed || sidebarModules.hidden);
    });
    if (activeModule) {
      setSidebarCollapsed(false);
      setModulesOpen(true);
    }
    if (window.lucide) window.lucide.createIcons({ root: sidebarNav });
  }

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
  topbar.querySelector(".notification").addEventListener("click", () => {
    window.location.assign(new URL("#recent-activities", systemOverviewUrl).href);
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
