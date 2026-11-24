(() => {
  const switcher = document.querySelector(".dashboard-role-switcher");
  if (!switcher) return;

  const roles = [...switcher.querySelectorAll('input[name="dashboard-role"]')];
  const viewLabel = document.getElementById("dashboard-view-label");
  const roleContent = document.querySelectorAll(".dashboard [data-dashboard-roles]");
  const overviewCharts = document.querySelector(".overview-charts");
  const detailGrid = document.querySelector(".overview-detail-grid");
  const staffAttendance = document.querySelector(".staff-attendance");
  const performance = document.querySelector('[aria-labelledby="performance-title"]');
  const importantDates = document.querySelector(".important-dates");
  const feeCollection = document.querySelector(".fee-overview");
  const storageKey = "vaps-dashboard-role";

  function showRole(value) {
    const selected = roles.find((role) => role.value === value) ?? roles[0];
    selected.checked = true;
    viewLabel.textContent = selected.labels[0].textContent.trim();
    roleContent.forEach((item) => {
      item.hidden = !item.dataset.dashboardRoles.split(" ").includes(selected.value);
    });
    if (selected.value === "teacher") {
      overviewCharts.insertBefore(performance, staffAttendance);
    } else if (performance.parentElement !== detailGrid) {
      detailGrid.append(performance);
    }
    if (selected.value === "accountant") {
      overviewCharts.insertBefore(feeCollection, importantDates);
    } else if (feeCollection.parentElement !== detailGrid) {
      detailGrid.prepend(feeCollection);
    }
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
