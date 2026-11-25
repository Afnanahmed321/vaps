(() => {
  const get = (id) => document.getElementById("attendance-" + id);
  const options = window.AdmissionOptions;
  const form = get("form");
  const year = get("year");
  const classSelect = get("class");
  const section = get("section");
  const student = get("student");
  const search = get("search");
  const month = get("month");
  const from = get("from");
  const to = get("to");
  const summary = get("summary");
  let records = [];
  let rosterStatus = "Loading saved admissions…";

  const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" });
  const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" });
  const setting = (name) => form.elements.namedItem(name).value;
  const nameOf = (record) => [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  options.populate(month, Array.from({ length: 12 }, (_, index) => monthFormat.format(Date.UTC(2000, index, 1))));

  function updateStudents() {
    const individual = setting("scope") === "individual";
    get("lookup").disabled = !individual;
    get("student-fields").hidden = !individual;
    search.disabled = !individual || !section.value;
    const byName = setting("lookup") === "name";
    search.placeholder = byName ? "Search by name" : "Search by admission number";
    const previous = student.value;
    const term = search.value.trim().toLowerCase();
    options.populate(student, []);
    if (!search.disabled) {
      const matches = records.filter((record) => record.year === year.value &&
        record.className === classSelect.value && record.section === section.value);
      for (const record of matches) {
        const name = nameOf(record);
        const number = String(record.admissionNo ?? "");
        if ((byName ? name : number).toLowerCase().includes(term)) {
          const label = (byName ? [name, number] : [number, name]).filter(Boolean).join(" · ");
          student.add(new Option(label, String(record.serial)));
        }
      }
      if ([...student.options].some((option) => option.value === previous)) student.value = previous;
    }
    student.disabled = search.disabled || student.options.length === 1;
    get("roster-status").textContent = individual
      ? rosterStatus || (!section.value ? "Choose a class and section to find students."
        : student.disabled ? "No students match these filters." : "")
      : "";
  }

  function updateSections() {
    const saved = records.filter((record) => record.year === year.value && record.className === classSelect.value);
    options.populate(section, [...options.sections(), ...saved.map((record) => record.section).filter(Boolean)]);
    section.disabled = !year.value || !classSelect.value;
  }

  function updateClasses() {
    const saved = records.filter((record) => record.year === year.value);
    options.populate(classSelect, [...options.classes(), ...saved.map((record) => record.className).filter(Boolean)]);
    classSelect.disabled = !year.value;
    updateSections();
  }

  function updatePeriod() {
    for (const panel of form.querySelectorAll("[data-period]")) {
      panel.hidden = panel.dataset.period !== setting("period");
      for (const field of panel.querySelectorAll("input, select")) field.disabled = panel.hidden;
    }
    to.min = from.value;
  }

  function refreshYears() {
    const previous = year.value;
    options.populate(year, [...options.years(), ...records.map((record) => record.year).filter(Boolean)]);
    if (previous) year.value = previous;
  }

  function resetView() {
    search.value = "";
    updateClasses();
    updateStudents();
    updatePeriod();
    summary.hidden = true;
  }

  refreshYears();
  resetView();

  form.addEventListener("change", ({ target }) => {
    if (target === year) updateClasses();
    if (target === classSelect) updateSections();
    if ([year, classSelect, section].includes(target) || ["scope", "lookup"].includes(target.name)) {
      search.value = "";
      updateStudents();
    }
    updatePeriod();
  });
  form.addEventListener("input", ({ target }) => {
    summary.hidden = true;
    if (target === search) updateStudents();
    if (target === from) to.min = from.value;
  });
  form.addEventListener("reset", () => queueMicrotask(resetView));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const individual = setting("scope") === "individual";
    if (individual && !student.value) {
      get("roster-status").textContent = rosterStatus || "Select a matching student to run the report.";
      search.focus();
      return;
    }
    const formatDate = (input) => dateFormat.format(new Date(input.value + "T00:00:00Z"));
    const period = setting("period");
    const dates = period === "monthly"
      ? month.value + (form.elements.dateWise.checked ? " (by date)" : "")
      : period === "range" ? formatDate(from) + " to " + formatDate(to) : formatDate(get("day"));
    const selection = individual ? student.selectedOptions[0].text : "All students";
    summary.textContent = [year.value, classSelect.value + " / " + section.value, selection, dates].join(" · ");
    summary.hidden = false;
  });

  window.AdmissionRecords.readRecords().then((saved) => {
    records = saved;
    rosterStatus = records.length ? "" : "No admissions are saved in this browser.";
    const previousClass = classSelect.value;
    const previousSection = section.value;
    refreshYears();
    updateClasses();
    classSelect.value = previousClass;
    updateSections();
    section.value = previousSection;
    updateStudents();
  }).catch(() => {
    rosterStatus = "Saved admissions could not be loaded.";
    updateStudents();
  });
})();
