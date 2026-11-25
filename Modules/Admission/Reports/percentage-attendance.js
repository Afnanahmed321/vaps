(() => {
  const form = document.getElementById("percentage-form");
  const { scope, academicYear, className, section, percentage } = form.elements;
  const hint = document.getElementById("percentage-hint");
  const result = document.querySelector("#percentage-results .master-card");
  const selection = document.getElementById("percentage-selection");
  const { years, classes, sections, populate } = window.AdmissionOptions;

  populate(academicYear, years().sort().reverse());
  if (academicYear.options.length > 1) {
    academicYear.options[1].defaultSelected = true;
    academicYear.selectedIndex = 1;
  }
  populate(className, classes());
  populate(section, sections());

  function updateFilters() {
    const individual = scope.value === "individual";
    className.disabled = !individual || !academicYear.value;
    section.disabled = className.disabled || !className.value;
    hint.hidden = !individual;
  }

  form.addEventListener("change", ({ target }) => {
    if (target === academicYear || scope.value === "all") className.value = "";
    if (target !== section && target !== percentage) section.value = "";
    updateFilters();
  });

  form.addEventListener("input", () => { result.hidden = true; });
  form.addEventListener("reset", () => {
    result.hidden = true;
    queueMicrotask(updateFilters);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const group = scope.value === "individual"
      ? className.value + " / " + section.value
      : "All classes and sections";
    selection.textContent = [academicYear.value, group, percentage.value + "%"].join(" · ");
    result.hidden = false;
  });
})();
