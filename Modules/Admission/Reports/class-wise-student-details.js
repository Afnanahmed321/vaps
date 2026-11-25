(() => {
  const get = (id) => document.getElementById("details-" + id);
  const form = document.getElementById("class-details-form");
  const year = get("year");
  const category = get("category");
  const search = get("search");
  const selectAll = get("select-all");
  const feedback = get("feedback");
  const results = get("results");
  const header = results.querySelector("thead tr");
  const body = results.querySelector("tbody");
  const exportButton = get("export");
  const printButton = get("print");
  const options = window.AdmissionOptions;
  const columns = [
    ["Student Name", (record) => [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ")],
    ["Admission No.", (record) => record.admissionNo],
    ["Roll No.", (record) => record.rollNo],
    ["Registration No.", (record) => record.registrationNo],
    ["Current Class", (record) => record.className],
    ["Current Section", (record) => record.section],
    ["Student Category", (record) => record.studentCategory],
    ["Admission Date", (record) => record.admissionDate],
    ["Status", (record) => record.status || "Active"]
  ];
  let records = [];
  let rows = [];
  let headings = [];
  let academicYears = [];
  try {
    const saved = JSON.parse(localStorage.getItem("vaps-admission-academic-years"));
    if (Array.isArray(saved)) academicYears = saved;
  } catch {
    // Fall back to the academic year saved on each admission.
  }

  function choices(container, name, values) {
    container.replaceChildren();
    for (const [value, caption] of values) {
      const label = document.createElement("label");
      label.className = "details-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = value;
      label.append(input, caption);
      container.append(label);
    }
  }

  function updateGroup(id, values) {
    const fieldset = get(id);
    const list = fieldset.querySelector(".details-choices");
    const previous = new Set([...list.querySelectorAll(":checked")].map((input) => input.value));
    choices(list, id, [...new Set(values.filter(Boolean))].map((value) => [value, value]));
    for (const input of list.querySelectorAll("input")) input.checked = previous.has(input.value);
    fieldset.disabled = !list.children.length;
  }

  function updateSections() {
    const classes = new FormData(form).getAll("classes");
    const matches = records.filter((record) => record.year === year.value && classes.includes(record.className));
    updateGroup("sections", classes.length ? [...options.sections(), ...matches.map((record) => record.section)] : []);
  }

  function updateYear() {
    const matches = records.filter((record) => record.year === year.value);
    updateGroup("sections", []);
    updateGroup("classes", []);
    updateGroup("classes", year.value ? [...options.classes(), ...matches.map((record) => record.className)] : []);
    options.populate(category, matches.map((record) => record.studentCategory).filter(Boolean));
  }

  choices(get("columns"), "column", columns.map(([label], index) => [index, label]));
  const columnInputs = [...get("columns").querySelectorAll("input")];
  function updateColumns() {
    const term = search.value.trim().toLowerCase();
    for (const input of columnInputs) input.parentElement.hidden = !input.parentElement.textContent.toLowerCase().includes(term);
    const selected = columnInputs.filter((input) => input.checked).length;
    selectAll.checked = selected === columns.length;
    selectAll.indeterminate = selected > 0 && selected < columns.length;
    get("column-count").textContent = `${selected} of ${columns.length} columns selected`;
  }

  function clearResults() {
    results.hidden = true;
    printButton.disabled = exportButton.disabled = true;
    feedback.textContent = "";
  }

  function renderRows() {
    body.replaceChildren();
    for (const values of rows) {
      const row = body.insertRow();
      for (const value of values) row.insertCell().textContent = value === "" ? "—" : value;
    }
  }

  function matchesGroup(record, group, academicYear) {
    const status = String(record.status || "active").trim().toLowerCase();
    if (group === "all") return true;
    if (group === "deactivated") return ["inactive", "deactivated", "deactive"].includes(status);
    if (group !== "new") return status === group;
    if (!["active", "studying", "new admission"].includes(status)) return false;
    if (status === "new admission") return true;
    if (!academicYear?.from || !academicYear.to) return true;
    return Boolean(record.admissionDate && record.admissionDate >= academicYear.from && record.admissionDate <= academicYear.to);
  }

  search.addEventListener("input", updateColumns);
  selectAll.addEventListener("change", () => {
    for (const input of columnInputs) input.checked = selectAll.checked;
    updateColumns();
  });
  form.addEventListener("change", ({ target }) => {
    if (target === search) return;
    clearResults();
    if (target === year) updateYear();
    if (target.name === "classes") updateSections();
    if (target.name === "column") updateColumns();
  });
  form.addEventListener("reset", () => {
    clearResults();
    queueMicrotask(() => { updateYear(); updateColumns(); });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearResults();
    const filters = new FormData(form);
    const classes = filters.getAll("classes");
    const sections = filters.getAll("sections");
    const selected = filters.getAll("column").map((index) => columns[index]);
    if (!classes.length || !sections.length || !selected.length) {
      feedback.textContent = !classes.length ? "Select at least one class." : !sections.length
        ? "Select at least one section." : "Select at least one report column.";
      return;
    }
    const group = filters.get("group");
    const academicYear = academicYears.find((entry) => entry?.year === year.value);
    headings = selected.map(([label]) => label);
    rows = records.filter((record) => record.year === year.value && classes.includes(record.className) &&
      sections.includes(record.section) && (!category.value || category.value === record.studentCategory) &&
      matchesGroup(record, group, academicYear)).map((record) => selected.map(([, value]) => value(record) ?? ""));
    header.replaceChildren();
    for (const [index, label] of headings.entries()) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      if (filters.get("format") === "grid" && rows.length) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label + " ↕";
        button.addEventListener("click", () => {
          const descending = cell.getAttribute("aria-sort") === "ascending";
          for (const heading of header.children) heading.removeAttribute("aria-sort");
          cell.setAttribute("aria-sort", descending ? "descending" : "ascending");
          rows.sort((a, b) => String(a[index]).localeCompare(String(b[index]), undefined, { numeric: true }) * (descending ? -1 : 1));
          renderRows();
        });
        cell.replaceChildren(button);
      }
      header.append(cell);
    }
    renderRows();
    get("result-count").textContent = rows.length
      ? `${rows.length} ${rows.length === 1 ? "student" : "students"} found`
      : "No saved students match these filters.";
    results.hidden = false;
    printButton.disabled = exportButton.disabled = !rows.length;
    get("results-title").focus();
  });

  exportButton.addEventListener("click", () => {
    const workbook = window.createAcademicYearWorkbook([headings, ...rows], "Student Details");
    const url = URL.createObjectURL(workbook);
    const link = document.createElement("a");
    link.href = url;
    link.download = "class-wise-student-details.xlsx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  printButton.addEventListener("click", () => window.print());

  year.disabled = true;
  updateColumns();
  window.AdmissionRecords.readRecords().then((saved) => {
    records = saved;
    options.populate(year, [...options.years(), ...records.map((record) => record.year).filter(Boolean)]);
    year.disabled = false;
  }).catch(() => {
    feedback.textContent = "Saved admissions could not be loaded.";
    form.querySelector('button[type="submit"]').disabled = true;
  });
})();
