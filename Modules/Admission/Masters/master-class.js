(() => {
  const get = (id) => document.getElementById(id);
  const form = get("area-form");
  const editor = get("area-dialog");
  const listDialog = get("class-list-dialog");
  const search = get("area-search");
  const rows = get("area-rows");
  const pageSize = get("area-page-size");
  const feedback = get("area-feedback");
  const error = get("area-error");
  const columns = [...document.querySelectorAll(".class-table [data-sort]")];
  const pager = [...document.querySelectorAll(".area-pagination [data-page]")];
  const { recordType = "Class", storageKey = "vaps.admission.masterClasses" } = form.dataset;
  const defaults = get("admission-record-defaults");
  const viewPerRecord = form.hasAttribute("data-row-details");
  const sampleNames = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  let records = defaults ? JSON.parse(defaults.textContent) : sampleNames.map((name, i) => ({
    serial: i + 1, name, code: String(i + 1), capacity: 100,
    order: i < 2 ? 5 - i : i + 4, maxYear: i + 7, maxMonth: 0, maxDays: 0,
    minYear: i + 5, minMonth: 0, minDays: 0, active: true
  }));
  let sortKey = "serial";
  let direction = 1;
  let page = 1;
  let lastPage = 1;
  let editing = null;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) records = saved;
  } catch {
    feedback.textContent = `Saved ${recordType.toLowerCase()} records could not be loaded.`;
  }

  function save(next, message, target = feedback) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      target.hidden = false;
      target.textContent = "Changes could not be saved in this browser.";
      return false;
    }
    records = next;
    feedback.textContent = message;
    render();
    return true;
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const matches = records.filter((record) => Object.values(record).some((value) =>
      String(typeof value === "boolean" ? (value ? "Active" : "Inactive") : value).toLowerCase().includes(query)));
    matches.sort((a, b) => direction * String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }));
    const size = Number(pageSize.value);
    lastPage = Math.max(1, Math.ceil(matches.length / size));
    page = Math.max(1, Math.min(page, lastPage));
    const start = (page - 1) * size;
    rows.replaceChildren();

    for (const record of matches.slice(start, start + size)) {
      const row = rows.insertRow();
      for (const button of columns) row.insertCell().textContent = record[button.dataset.sort];
      const label = document.createElement("label");
      label.className = "class-status";
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-label", `${recordType} ${record.name} active`);
      toggle.dataset.serial = record.serial;
      toggle.checked = record.active;
      const state = document.createElement("span");
      state.textContent = record.active ? "Active" : "Inactive";
      toggle.addEventListener("change", () => {
        const next = records.map((item) => item === record ? { ...item, active: toggle.checked } : item);
        if (save(next, `${recordType} status updated.`)) {
          (rows.querySelector(`input[data-serial="${record.serial}"]`) || search).focus();
        } else {
          toggle.checked = record.active;
        }
      });
      label.append(toggle, state);
      const edit = document.createElement("button");
      edit.className = "button button-secondary";
      edit.type = "button";
      edit.textContent = "Edit";
      edit.setAttribute("aria-label", `Edit ${recordType.toLowerCase()} ${record.name}`);
      edit.addEventListener("click", () => openEditor(record));
      if (defaults) {
        const actions = document.createElement("div");
        actions.className = "section-row-actions";
        if (viewPerRecord) {
          const view = document.createElement("button");
          view.type = "button";
          view.className = "button button-secondary";
          view.textContent = "View";
          view.setAttribute("aria-label", `View ${record.name} in ${record.category}`);
          view.addEventListener("click", () => openClassList(false, record));
          actions.append(view);
        }
        if (!form.hasAttribute("data-status-only")) actions.append(edit);
        actions.append(label);
        row.insertCell().append(actions);
      } else {
        row.insertCell().append(label);
        row.insertCell().append(edit);
      }
    }
    if (!matches.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = columns.length + (defaults ? 1 : 2);
      cell.className = "area-empty";
      cell.textContent = "No results.";
    }
    get("area-range").textContent = matches.length
      ? `Showing ${start + 1} to ${Math.min(start + size, matches.length)} of ${matches.length} entries`
      : "No entries found";
    for (const button of pager) {
      button.disabled = ["first", "prev"].includes(button.dataset.page) ? page === 1 : page === lastPage;
    }
    for (const button of columns) {
      button.closest("th").setAttribute("aria-sort", button.dataset.sort === sortKey
        ? (direction === 1 ? "ascending" : "descending") : "none");
    }
  }

  function openEditor(record = null) {
    editing = record;
    form.reset();
    error.hidden = true;
    editor.querySelector("details").open = true;
    get("area-dialog-title").textContent = `${record ? "Edit" : "Add"} Master ${recordType}`;
    if (record) {
      for (const [key, value] of Object.entries(record)) {
        const field = form.elements.namedItem(key);
        if (field) field.value = String(value);
      }
    }
    editor.showModal();
  }

  function editorError(message) {
    error.hidden = false;
    error.textContent = message;
  }

  get("area-add").addEventListener("click", () => openEditor());
  for (const id of ["area-cancel", "area-close"]) get(id).addEventListener("click", () => editor.close());
  form.addEventListener("invalid", () => { editor.querySelector("details").open = true; }, true);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const record = Object.fromEntries(new FormData(form));
    for (const field of form.querySelectorAll('input[type="text"], input:not([type])')) {
      record[field.name] = record[field.name].trim();
      if (field.required && !record[field.name]) {
        editorError(`Enter ${field.labels[0].textContent.toLowerCase()}.`);
        field.focus();
        return;
      }
    }
    if (form.elements.namedItem("minYear")) {
      const age = (limit) => ["Year", "Month", "Days"].map((unit) => Number(record[limit + unit]));
      const min = age("min");
      const max = age("max");
      const difference = min.map((value, index) => value - max[index]).find((value) => value !== 0);
      if (difference > 0) {
        editorError("Minimum age must be at or below maximum age.");
        return;
      }
    }
    for (const field of form.querySelectorAll('input[type="number"]')) record[field.name] = field.valueAsNumber;
    record.active = record.active === "true";
    record.serial = editing?.serial ?? Math.max(0, ...records.map((item) => item.serial)) + 1;
    const next = editing ? records.map((item) => item === editing ? record : item) : [...records, record];
    if (save(next, `${recordType} ${editing ? "updated" : "added"}.`, error)) editor.close();
  });

  function openClassList(ordering, record = null) {
    get("class-list-title").textContent = ordering ? `Set ${recordType} Order` : `${recordType} Details`;
    get("class-list-save").hidden = !ordering;
    get("class-list-cancel").textContent = ordering ? "Cancel" : "Close";
    get("class-list-error").hidden = true;
    const head = get("class-list-head");
    const body = get("class-list-rows");
    head.replaceChildren();
    body.replaceChildren();
    head.closest("table").classList.toggle("is-details", !ordering);
    const keys = ordering ? ["name", "code", "order"] : [...columns.map((column) => column.dataset.sort), "active"];
    const headers = head.insertRow();
    for (const key of keys) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = key === "active" ? "Status" : columns.find((column) => column.dataset.sort === key).textContent.trim();
      headers.append(th);
    }
    const list = (record ? [record] : [...records]).sort((a, b) => ordering ? a.order - b.order || a.serial - b.serial : a.serial - b.serial);
    for (const record of list) {
      const row = body.insertRow();
      for (const key of keys) {
        const cell = row.insertCell();
        if (ordering && key === "order") {
          const input = document.createElement("input");
          input.type = "number";
          input.min = "0";
          input.step = "1";
          input.required = true;
          input.name = record.serial;
          input.value = record.order;
          input.setAttribute("aria-label", `Order for ${recordType.toLowerCase()} ${record.name}`);
          cell.append(input);
        } else {
          cell.textContent = key === "active" ? (record.active ? "Active" : "Inactive") : record[key];
        }
      }
    }
    listDialog.showModal();
  }

  get("class-details")?.addEventListener("click", () => openClassList(false));
  get("class-order")?.addEventListener("click", () => openClassList(true));
  for (const id of ["class-list-close", "class-list-cancel"]) get(id)?.addEventListener("click", () => listDialog.close());
  get("class-list-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (get("class-list-save").hidden) return;
    const values = new FormData(event.currentTarget);
    const next = records.map((record) => ({ ...record, order: Number(values.get(record.serial)) }));
    if (save(next, `${recordType} order saved.`, get("class-list-error"))) {
      sortKey = "order";
      direction = 1;
      page = 1;
      render();
      listDialog.close();
    }
  });

  function resetPage() { page = 1; render(); }
  search.addEventListener("input", resetPage);
  pageSize.addEventListener("change", resetPage);
  for (const button of columns) button.addEventListener("click", () => {
    direction = sortKey === button.dataset.sort ? -direction : 1;
    sortKey = button.dataset.sort;
    resetPage();
  });
  for (const button of pager) button.addEventListener("click", () => {
    page = { first: 1, prev: page - 1, next: page + 1, last: lastPage }[button.dataset.page];
    render();
  });

  const dictate = get("area-dictate");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = document.documentElement.lang || "en";
    recognition.onstart = () => dictate.setAttribute("aria-pressed", "true");
    recognition.onend = () => dictate.setAttribute("aria-pressed", "false");
    recognition.onresult = (event) => {
      search.value = event.results[0][0].transcript.trim();
      resetPage();
    };
    recognition.onerror = () => { feedback.textContent = "Voice search was interrupted."; };
    dictate.addEventListener("click", () => {
      try {
        if (dictate.getAttribute("aria-pressed") === "true") recognition.stop();
        else recognition.start();
      } catch {
        feedback.textContent = "Voice search is unavailable. Try typing your search.";
      }
    });
  } else {
    dictate.addEventListener("click", () => { feedback.textContent = "Voice search is unavailable in this browser."; });
  }
  render();
})();
