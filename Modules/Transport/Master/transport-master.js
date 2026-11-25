(() => {
  const byId = (id) => document.getElementById(id);
  const search = byId("area-search");
  const pageSize = byId("area-page-size");
  const rows = byId("area-rows");
  const dialog = byId("area-dialog");
  const form = byId("area-form");
  const { storageKey, recordLabel } = form.dataset;
  const fields = [...form.querySelectorAll("[name]")];
  const numericColumns = new Set(["serial", ...fields.filter((field) => field.type === "number").map((field) => field.name)]);
  const requiredFields = fields.filter((field) => field.required);
  const selectAll = byId("vehicle-select-all");
  const selected = new Set();
  const documentsField = byId("vehicle-documents");
  const error = byId("area-error");
  const feedback = byId("area-feedback");
  const sortButtons = [...document.querySelectorAll(".area-table [data-sort]")];
  const columns = Array.from(document.querySelectorAll(".area-table [data-column], .area-table [data-sort]"),
    (column) => column.dataset.column ?? column.dataset.sort);
  const pageButtons = [...document.querySelectorAll(".area-pagination [data-page]")];
  const statusSwitch = form.hasAttribute("data-status-switch");
  const deleteDialog = byId("record-delete-dialog");
  const defaults = byId("record-defaults");
  let pendingDelete = null;
  let areas = defaults ? JSON.parse(defaults.textContent) : [];
  let editing = null;
  let sort = "serial";
  let direction = 1;
  let page = 1;
  let lastPage = 1;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) areas = saved;
  } catch {
    feedback.textContent = `Saved ${recordLabel.toLowerCase()} records could not be loaded.`;
  }

  function documentUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function syncSelection() {
    const checkboxes = [...rows.querySelectorAll('input[type="checkbox"]')];
    const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
    selectAll.disabled = checkboxes.length === 0;
    selectAll.checked = checkedCount > 0 && checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && !selectAll.checked;
  }

  function createStatusSwitch(area) {
    const label = document.createElement("label");
    label.className = "record-status-switch";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = area.status === "Active";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-label", `${area.name} active`);
    const text = document.createElement("span");
    text.textContent = area.status;
    toggle.addEventListener("change", () => {
      const status = toggle.checked ? "Active" : "Inactive";
      const next = areas.map((item) => item === area ? { ...item, status } : item);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        toggle.checked = area.status === "Active";
        feedback.textContent = "Status could not be saved in this browser.";
        return;
      }
      areas = next;
      feedback.textContent = `${recordLabel} marked ${status.toLowerCase()}.`;
      render();
      (rows.querySelector(`[data-record-serial="${area.serial}"] input[role="switch"]`) || search).focus();
    });
    label.append(toggle, text);
    return label;
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const searchColumns = statusSwitch ? [...columns, "status"] : columns;
    const filtered = areas.filter((area) => searchColumns
      .some((column) => String(area[column] ?? "").toLocaleLowerCase().includes(query)));
    filtered.sort((first, second) => direction * (numericColumns.has(sort)
      ? Number(first[sort]) - Number(second[sort])
      : (first[sort] ?? "").localeCompare(second[sort] ?? "")));

    const size = Number(pageSize.value);
    lastPage = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(page, lastPage);
    const start = (page - 1) * size;
    rows.replaceChildren();
    for (const area of filtered.slice(start, start + size)) {
      const row = rows.insertRow();
      if (statusSwitch) row.dataset.recordSerial = area.serial;
      if (selectAll) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = area.serial;
        checkbox.checked = selected.has(checkbox.value);
        checkbox.setAttribute("aria-label", `Select ${area.name}`);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) selected.add(checkbox.value);
          else selected.delete(checkbox.value);
          syncSelection();
        });
        row.insertCell().append(checkbox);
      }
      for (const column of columns) {
        const cell = row.insertCell();
        const url = column === "documents" ? documentUrl(area.documents) : null;
        if (url) {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "View documents";
          cell.append(link);
        } else if (column === "mandatory") {
          const badge = document.createElement("span");
          badge.className = "record-mandatory-badge";
          badge.dataset.mandatory = area.mandatory;
          badge.textContent = area.mandatory;
          cell.append(badge);
        } else {
          cell.textContent = column === "documents" ? "—" : area[column] || "—";
        }
      }
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "button button-secondary";
      edit.textContent = "Edit";
      edit.setAttribute("aria-label", `Edit ${area.name}`);
      edit.addEventListener("click", () => openEditor(area));
      const cell = row.insertCell();
      const actions = statusSwitch ? document.createElement("div") : cell;
      if (statusSwitch) {
        actions.className = "record-status-actions";
        cell.append(actions);
      }
      actions.append(edit);
      if (statusSwitch) actions.append(createStatusSwitch(area));
      if (deleteDialog) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button button-secondary record-delete-button";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", `Delete ${area.name}`);
        remove.addEventListener("click", () => {
          pendingDelete = area;
          deleteDialog.returnValue = "";
          byId("record-delete-message").textContent = `Delete “${area.name}”?`;
          deleteDialog.showModal();
        });
        actions.append(remove);
      }
    }

    if (!filtered.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = columns.length + (selectAll ? 2 : 1);
      cell.className = "area-empty";
      cell.textContent = "No results.";
    }
    if (selectAll) syncSelection();
    byId("area-range").textContent = filtered.length
      ? `${start + 1}–${Math.min(start + size, filtered.length)} of ${filtered.length} entries`
      : "No entries found";

    for (const button of pageButtons) {
      button.disabled = ["first", "prev"].includes(button.dataset.page) ? page === 1 : page === lastPage;
    }
    for (const button of sortButtons) {
      button.closest("th").setAttribute("aria-sort", button.dataset.sort === sort
        ? direction === 1 ? "ascending" : "descending"
        : "none");
    }
  }

  function openEditor(area = null) {
    editing = area;
    byId("area-dialog-title").textContent = `${area ? "Edit" : "Add"} ${recordLabel}`;
    form.reset();
    if (area) {
      for (const field of fields) field.value = area[field.name] ?? "";
    }
    error.hidden = true;
    dialog.querySelector("details").open = true;
    dialog.showModal();
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  selectAll?.addEventListener("change", () => {
    for (const checkbox of rows.querySelectorAll('input[type="checkbox"]')) {
      checkbox.checked = selectAll.checked;
      if (checkbox.checked) selected.add(checkbox.value);
      else selected.delete(checkbox.value);
    }
    syncSelection();
  });

  deleteDialog?.addEventListener("close", () => {
    const record = pendingDelete;
    pendingDelete = null;
    if (!record || deleteDialog.returnValue !== "delete") return;
    const next = areas.filter((area) => area.serial !== record.serial);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      feedback.textContent = `The ${recordLabel.toLowerCase()} could not be deleted in this browser.`;
      return;
    }
    areas = next;
    feedback.textContent = `${recordLabel} deleted.`;
    render();
    search.focus();
  });

  byId("area-add").addEventListener("click", () => openEditor());
  for (const id of ["area-cancel", "area-close"]) {
    byId(id).addEventListener("click", () => dialog.close());
  }

  form.addEventListener("invalid", () => {
    dialog.querySelector("details").open = true;
  }, true);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const blankField = requiredFields.find((field) => !field.value.trim());
    if (blankField) {
      showError(`Enter ${blankField.labels[0].textContent.toLowerCase()}.`);
      blankField.focus();
      return;
    }

    const documentValue = documentsField?.value.trim();
    if (documentValue && !documentUrl(documentValue)) {
      showError("Enter an HTTP or HTTPS document URL.");
      documentsField.focus();
      return;
    }

    const serial = editing?.serial ?? areas.reduce((highest, area) => Math.max(highest, area.serial), 0) + 1;
    const values = Object.fromEntries(fields.map((field) => [field.name, field.value.trim()]));
    const record = { serial, ...values };
    const next = editing ? areas.map((area) => area.serial === serial ? record : area) : [...areas, record];
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      showError(`The ${recordLabel.toLowerCase()} could not be saved in this browser.`);
      return;
    }

    areas = next;
    dialog.close();
    feedback.textContent = `${recordLabel} ${editing ? "updated" : "added"}.`;
    render();
    if (editing) byId("area-search").focus();
  });

  for (const control of [search, pageSize]) {
    control.addEventListener(control === search ? "input" : "change", () => {
      page = 1;
      render();
    });
  }
  for (const button of sortButtons) {
    button.addEventListener("click", () => {
      direction = sort === button.dataset.sort ? -direction : 1;
      sort = button.dataset.sort;
      page = 1;
      render();
    });
  }
  for (const button of pageButtons) {
    button.addEventListener("click", () => {
      page = { first: 1, prev: page - 1, next: page + 1, last: lastPage }[button.dataset.page];
      render();
    });
  }

  const dictate = byId("area-dictate");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = document.documentElement.lang || "en";
    recognition.onstart = () => dictate.setAttribute("aria-pressed", "true");
    recognition.onend = () => dictate.setAttribute("aria-pressed", "false");
    recognition.onerror = () => { feedback.textContent = "Voice search was interrupted. Try typing your search."; };
    recognition.onresult = (event) => {
      search.value = event.results[0][0].transcript.trim();
      page = 1;
      render();
    };
    dictate.addEventListener("click", () => {
      try {
        if (dictate.getAttribute("aria-pressed") === "true") recognition.stop();
        else recognition.start();
      } catch {
        feedback.textContent = "Voice search is unavailable. Try typing your search.";
      }
    });
  } else {
    dictate.addEventListener("click", () => {
      feedback.textContent = "Voice search is unavailable in this browser.";
    });
  }

  render();
})();
