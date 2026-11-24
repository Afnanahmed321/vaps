(() => {
  const switcher = document.querySelector(".dashboard-role-switcher");
  if (!switcher) return;

  const roles = [...switcher.querySelectorAll('input[name="dashboard-role"]')];
  const roleContent = document.querySelectorAll(".dashboard [data-dashboard-roles]");
  const storageKey = "vaps-dashboard-role";

  function showRole(value) {
    const selected = roles.find((role) => role.value === value) ?? roles[0];
    selected.checked = true;
    roleContent.forEach((item) => {
      item.hidden = !item.dataset.dashboardRoles.split(" ").includes(selected.value);
    });
  }

  let savedRole;
  try {
    savedRole = localStorage.getItem(storageKey);
  } catch {}

  showRole(savedRole ?? roles.find((role) => role.checked)?.value);
  switcher.addEventListener("change", (event) => {
    if (!roles.includes(event.target)) return;

    showRole(event.target.value);
    try {
      localStorage.setItem(storageKey, event.target.value);
    } catch {}
  });
})();
