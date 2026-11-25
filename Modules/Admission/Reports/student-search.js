(() => {
  const get = (id) => document.getElementById(id);
  const form = get("student-search-form");
  const criteria = get("student-search-rows");
  const template = get("student-search-template");
  const results = get("student-search-results");
  const resultRows = get("student-search-result-rows");
  const feedback = get("student-search-feedback");
  const exportButton = get("student-search-export");
  const printButton = get("student-search-print");
  const headings = ["Admission No.", "Student Name", "Academic Year", "Class", "Section", "Status"];
  const collator = new Intl.Collator(undefined, { numeric: true });
  let rows = [];
  let searchVersion = 0;

  function clearResults() {
    searchVersion += 1;
    rows = [];
    results.hidden = true;
    resultRows.replaceChildren();
    exportButton.disabled = true;
    printButton.disabled = true;
    feedback.textContent = "";
  }

  function syncCriteria() {
    Array.from(criteria.children).forEach((row, index) => {
      row.setAttribute("aria-label", `Criterion ${index + 1}`);
      row.querySelector("[data-condition-label]").hidden = index === 0;
      row.querySelector("[data-remove]").disabled = criteria.children.length === 1;
    });
  }

  function addCriterion(focus = false) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector("[data-remove]").addEventListener("click", () => {
      const adjacent = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      clearResults();
      syncCriteria();
      adjacent?.querySelector("[data-field]").focus();
    });
    criteria.append(row);
    syncCriteria();
    if (focus) row.querySelector("[data-field]").focus();
  }

  function getCriteria() {
    const conditions = [];
    for (const row of criteria.children) {
      const [field, operator, value, join] = row.querySelectorAll("select, input");
      const text = value.value.trim();
      if (!field.value && !operator.value && !text) continue;
      const missing = !field.value ? field : !operator.value ? operator : !text ? value : null;
      if (missing) {
        feedback.textContent = "Complete the field, operator, and value for each criterion you use.";
        missing.focus();
        return null;
      }
      conditions.push({ field: field.value, operator: operator.value, value: text.toLowerCase(), join: join.value });
    }
    return conditions;
  }

  function studentName(record) {
    return [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  }

  function studentStatus(record) {
    return String(record.status || "active").toLowerCase();
  }

  function meetsCondition(record, { field, operator, value }) {
    const actual = String((field === "name" ? studentName(record) : record[field]) ?? "").trim().toLowerCase();
    if (operator === "equals") return actual === value;
    if (operator === "not-equal") return actual !== value;
    if (operator === "contains") return actual.includes(value);
    if (!actual) return false;
    const comparison = collator.compare(actual, value);
    return operator === "greater" ? comparison > 0 : comparison < 0;
  }

  function matchesCriteria(record, conditions) {
    let matchesGroup = true;
    for (const [index, condition] of conditions.entries()) {
      if (index > 0 && condition.join === "OR") {
        if (matchesGroup) return true;
        matchesGroup = true;
      }
      matchesGroup = matchesGroup && meetsCondition(record, condition);
    }
    return matchesGroup;
  }

  function showResults(records) {
    const statusText = { active: "Studying", studying: "Studying", left: "Left", inactive: "Inactive", temporary: "Temporary" };
    rows = records.map((record) => [
      record.admissionNo, studentName(record), record.year, record.className,
      record.section, statusText[studentStatus(record)] ?? (record.status || "—")
    ]);
    for (const values of rows) {
      const row = resultRows.insertRow();
      for (const value of values) row.insertCell().textContent = value || "—";
    }
    if (!rows.length) {
      const cell = resultRows.insertRow().insertCell();
      cell.colSpan = headings.length;
      cell.className = "student-search-empty";
      cell.textContent = "No saved students match your filters.";
    }
    get("student-search-count").textContent = `${rows.length} ${rows.length === 1 ? "student" : "students"} found`;
    results.hidden = false;
    exportButton.disabled = printButton.disabled = !rows.length;
    get("student-search-results-title").focus();
  }

  get("student-search-add").addEventListener("click", () => {
    clearResults();
    addCriterion(true);
  });
  form.addEventListener("input", clearResults);
  form.addEventListener("change", clearResults);
  form.addEventListener("reset", () => {
    clearResults();
    criteria.replaceChildren();
    addCriterion();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearResults();
    const conditions = getCriteria();
    if (!conditions) return;
    const status = new FormData(form).get("status");
    const version = searchVersion;
    feedback.textContent = "Searching saved admissions…";
    try {
      const saved = await window.AdmissionRecords.readRecords();
      if (version !== searchVersion) return;
      const records = saved.filter((record) => {
        const state = studentStatus(record);
        const statusMatches = status === "all" || state === status || status === "studying" && state === "active";
        return statusMatches && matchesCriteria(record, conditions);
      });
      feedback.textContent = "";
      showResults(records);
    } catch {
      if (version === searchVersion) feedback.textContent = "Saved admissions could not be loaded in this browser.";
    }
  });

  exportButton.addEventListener("click", () => {
    const workbook = window.createAcademicYearWorkbook([headings, ...rows.map((row) =>
      row.map((value) => value ?? ""))], "Student Search");
    const url = URL.createObjectURL(workbook);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-search.xlsx";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  printButton.addEventListener("click", () => window.print());
  addCriterion();
})();
