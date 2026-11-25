(() => {
  const get = (id) => document.getElementById(id);
  const { years, classes, populate } = window.AdmissionOptions;
  const institute = "Tunbridge High School";
  const defaultYear = "2026-2027";
  const historicYear = "2023-2024";
  const grades = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const storageKey = "vaps.admission.attendanceEntryTypes";
  const form = get("attendance-form");
  const year = get("attendance-year");
  const classSearch = get("attendance-class-search");
  const classOptions = get("attendance-classes");
  const selectAll = get("attendance-select-all");
  const save = get("attendance-save");
  const feedback = get("attendance-feedback");
  const modes = [...form.querySelectorAll('[name="entry-type"]')];
  const recordSearch = get("attendance-record-search");
  const pageSize = get("attendance-page-size");
  const rows = get("attendance-rows");
  const sortButtons = [...document.querySelectorAll(".attendance-table [data-sort]")];
  const pageButtons = [...document.querySelectorAll(".attendance-pagination [data-page]")];
  const selectableClasses = [...new Set(["Pre Nursery", "Lower Nursery", "Upper Nursery", ...classes()])];
  const chosen = new Set();
  let records = grades.map((className, index) => ({
    serial: index + 1, institute, className, year: historicYear, type: "H"
  }));
  let editing = null;
  let sort = "serial";
  let direction = 1;
  let page = 1;
  let lastPage = 1;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(stored)) records = stored;
  } catch {
    feedback.textContent = "Saved settings could not be loaded.";
  }

  populate(year, [defaultYear, ...years(), ...records.map((record) => record.year)]);
  year.value = defaultYear;

  function filteredClasses() {
    const query = classSearch.value.trim().toLowerCase();
    const choices = editing ? [editing.className] : selectableClasses;
    return choices.filter((name) => name.toLowerCase().includes(query));
  }

  function syncSelection() {
    const visible = filteredClasses();
    const checked = visible.filter((name) => chosen.has(name)).length;
    selectAll.disabled = !visible.length || Boolean(editing);
    selectAll.checked = checked > 0 && checked === visible.length;
    selectAll.indeterminate = checked > 0 && checked < visible.length;
    get("attendance-selected").textContent = `${chosen.size} selected`;
    get("attendance-select-label").textContent = classSearch.value.trim() ? "Select matching classes" : "Select all classes";
    save.disabled = !year.value || !chosen.size || !modes.some((mode) => mode.checked);
  }

  function renderClasses() {
    const visible = filteredClasses();
    classOptions.replaceChildren();
    for (const name of visible) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = name;
      input.checked = chosen.has(name);
      input.disabled = Boolean(editing);
      input.addEventListener("change", () => {
        if (input.checked) chosen.add(name);
        else chosen.delete(name);
        syncSelection();
      });
      label.append(input, name);
      classOptions.append(label);
    }
    get("attendance-no-classes").hidden = visible.length > 0;
    syncSelection();
  }

  function resetEditor() {
    editing = null;
    year.disabled = false;
    year.value = defaultYear;
    classSearch.disabled = false;
    classSearch.value = "";
    chosen.clear();
    modes.forEach((mode, index) => { mode.checked = index === 0; });
    get("attendance-editor-title").textContent = "Configure Attendance Entry";
    get("attendance-legacy").hidden = true;
    renderClasses();
  }

  function edit(record) {
    editing = record;
    year.value = record.year;
    year.disabled = true;
    classSearch.value = "";
    classSearch.disabled = true;
    chosen.clear();
    chosen.add(record.className);
    modes.forEach((mode) => { mode.checked = mode.value === record.type; });
    get("attendance-legacy").hidden = modes.some((mode) => mode.checked);
    get("attendance-editor-title").textContent = `Edit Attendance Entry · Class ${record.className}`;
    feedback.textContent = "";
    get("attendance-editor").open = true;
    renderClasses();
    modes[0].focus();
  }

  function renderRecords() {
    const query = recordSearch.value.trim().toLowerCase();
    const matches = records.filter((record) => Object.values(record)
      .some((value) => String(value).toLowerCase().includes(query)));
    matches.sort((a, b) => direction * String(a[sort]).localeCompare(String(b[sort]), undefined, { numeric: true }));
    const size = Number(pageSize.value);
    lastPage = Math.max(1, Math.ceil(matches.length / size));
    page = Math.min(lastPage, Math.max(1, page));
    const start = (page - 1) * size;
    rows.replaceChildren();
    for (const record of matches.slice(start, start + size)) {
      const row = rows.insertRow();
      for (const button of sortButtons) row.insertCell().textContent = record[button.dataset.sort];
      const button = document.createElement("button");
      button.className = "button button-secondary";
      button.type = "button";
      button.textContent = "Edit";
      button.setAttribute("aria-label", `Edit attendance for class ${record.className}, ${record.year}`);
      button.addEventListener("click", () => edit(record));
      row.insertCell().append(button);
    }
    if (!matches.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = sortButtons.length + 1;
      cell.className = "attendance-empty";
      cell.textContent = "No attendance settings match your search.";
    }
    get("attendance-range").textContent = matches.length
      ? `Showing ${start + 1} to ${Math.min(start + size, matches.length)} of ${matches.length} entries`
      : "No entries found";
    for (const button of pageButtons) {
      button.disabled = ["first", "prev"].includes(button.dataset.page) ? page === 1 : page === lastPage;
    }
    for (const button of sortButtons) {
      button.closest("th").setAttribute("aria-sort", button.dataset.sort === sort
        ? (direction === 1 ? "ascending" : "descending") : "none");
    }
  }

  classSearch.addEventListener("input", renderClasses);
  selectAll.addEventListener("change", () => {
    for (const name of filteredClasses()) {
      if (selectAll.checked) chosen.add(name);
      else chosen.delete(name);
    }
    renderClasses();
  });
  year.addEventListener("change", syncSelection);
  for (const mode of modes) mode.addEventListener("change", syncSelection);

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    feedback.textContent = "";
    resetEditor();
    year.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const type = modes.find((mode) => mode.checked)?.value;
    if (!year.value || !chosen.size || !type) return;
    const selectedYear = year.value;
    const next = records.slice();
    let serial = next.reduce((max, item) => Math.max(max, item.serial), 0);
    for (const className of chosen) {
      const index = next.findIndex((record) => record.year === selectedYear && record.className === className);
      if (index >= 0) next[index] = { ...next[index], type };
      else next.push({ serial: ++serial, institute, className, year: selectedYear, type });
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      feedback.textContent = "Settings could not be saved in this browser.";
      return;
    }
    records = next;
    const count = chosen.size;
    resetEditor();
    year.value = selectedYear;
    feedback.textContent = `${type} saved for ${count} ${count === 1 ? "class" : "classes"} in ${selectedYear}.`;
    recordSearch.value = selectedYear;
    page = 1;
    renderRecords();
  });

  function resetPage() { page = 1; renderRecords(); }
  recordSearch.addEventListener("input", resetPage);
  pageSize.addEventListener("change", resetPage);
  for (const button of sortButtons) button.addEventListener("click", () => {
    direction = sort === button.dataset.sort ? -direction : 1;
    sort = button.dataset.sort;
    resetPage();
  });
  for (const button of pageButtons) button.addEventListener("click", () => {
    page = { first: 1, prev: page - 1, next: page + 1, last: lastPage }[button.dataset.page];
    renderRecords();
  });

  renderClasses();
  renderRecords();
})();
