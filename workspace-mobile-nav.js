(() => {
  const shell = document.querySelector(".app-shell");
  const sidebar = shell?.querySelector(":scope > .sidebar");
  const main = shell?.querySelector(":scope > .main-area");
  const topbar = main?.querySelector(":scope > .topbar");
  if (!sidebar || !topbar) return;

  const mobile = window.matchMedia("(max-width: 760px)");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "mobile-nav-trigger";
  trigger.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
  trigger.setAttribute("aria-label", "Open navigation");
  trigger.setAttribute("aria-expanded", "false");
  if (!sidebar.id) sidebar.id = "app-sidebar";
  trigger.setAttribute("aria-controls", sidebar.id);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "mobile-nav-close";
  close.setAttribute("aria-label", "Close navigation");
  close.innerHTML = '<span aria-hidden="true">×</span>';

  const backdrop = document.createElement("div");
  backdrop.className = "mobile-nav-backdrop";
  backdrop.hidden = true;
  backdrop.setAttribute("aria-hidden", "true");

  topbar.prepend(trigger);
  sidebar.prepend(close);
  shell.append(backdrop);
  shell.setAttribute("data-mobile-navigation", "");

  const search = topbar.querySelector('.global-search input[type="search"]');
  const desktopPlaceholder = search?.getAttribute("placeholder");
  const profile = topbar.querySelector(".profile-trigger");
  const desktopProfileLabel = profile?.getAttribute("aria-label");
  const bell = topbar.querySelector(".notification");
  if (bell) {
    const caption = document.createElement("span");
    caption.className = "mobile-notification-caption";
    caption.textContent = "Alerts";
    caption.setAttribute("aria-hidden", "true");
    bell.append(caption);
  }

  let open = false;

  function setDrawer(isOpen, restoreFocus = false) {
    open = isOpen && mobile.matches;
    shell.toggleAttribute("data-mobile-menu-open", open);
    document.body.toggleAttribute("data-mobile-menu-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    backdrop.hidden = !open;
    sidebar.inert = mobile.matches && !open;
    main.inert = open;

    if (open) {
      sidebar.setAttribute("role", "dialog");
      sidebar.setAttribute("aria-modal", "true");
      sidebar.setAttribute("aria-label", "Workspace navigation");
    } else if (sidebar.getAttribute("role") === "dialog") {
      sidebar.removeAttribute("role");
      sidebar.removeAttribute("aria-modal");
      sidebar.removeAttribute("aria-label");
    }

    if (open) close.focus();
    else if (restoreFocus && mobile.matches) trigger.focus();
  }

  function syncViewport() {
    const returnFocus = mobile.matches && sidebar.contains(document.activeElement);
    setDrawer(false, returnFocus);
    if (search && desktopPlaceholder !== null) {
      search.placeholder = mobile.matches ? "Search workspace…" : desktopPlaceholder;
    }
    if (profile) {
      if (mobile.matches) profile.setAttribute("aria-label", desktopProfileLabel || "Account profile");
      else if (desktopProfileLabel === null) profile.removeAttribute("aria-label");
    }
  }

  trigger.addEventListener("click", () => setDrawer(true));
  close.addEventListener("click", () => setDrawer(false, true));
  backdrop.addEventListener("click", () => setDrawer(false, true));
  sidebar.addEventListener("click", (event) => {
    if (event.target.closest(".nav-item[href], a[data-workspace-page]")) setDrawer(false);
  });
  document.addEventListener("keydown", (event) => {
    if (!open || event.target.closest?.("dialog:modal")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setDrawer(false, true);
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = [...sidebar.querySelectorAll('a[href], button:not(:disabled)')]
      .filter(node => node.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  mobile.addEventListener("change", syncViewport);
  syncViewport();
})();
