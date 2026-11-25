(() => {
  const get = (id) => document.getElementById(id);
  const form = get("birthday-form");
  const from = get("birthday-from");
  const to = get("birthday-to");
  const month = get("birthday-month");
  const results = get("birthday-results");
  const feedback = get("birthday-feedback");
  const rows = get("birthday-rows");
  const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
  let revision = 0;

  function syncForm() {
    const monthly = new FormData(form).get("report") === "month";
    for (const [control, hidden] of [[from, monthly], [to, monthly], [month, !monthly]]) {
      control.disabled = hidden;
      control.parentElement.hidden = hidden;
    }
    to.min = from.value || "1900-01-01";
    to.setCustomValidity(!monthly && from.value && to.value && to.value < from.value
      ? "Choose a To Date on or after the From Date." : "");
  }

  function clearResults() {
    revision += 1;
    results.hidden = true;
    feedback.textContent = "";
  }

  function birthdayInRange(monthDay, start, end) {
    for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year += 1) {
      const candidate = `${year}-${monthDay}`;
      if (candidate < start || candidate > end) continue;
      const date = new Date(candidate + "T00:00:00Z");
      if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === candidate) return candidate;
    }
    return "";
  }

  function render(matches) {
    rows.replaceChildren();
    for (const { record, date } of matches) {
      const row = rows.insertRow();
      const name = [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
      for (const value of [name, record.admissionNo, record.className, record.section, dateFormat.format(new Date(date + "T00:00:00Z"))]) {
        row.insertCell().textContent = value || "—";
      }
    }
    if (!matches.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = 5;
      cell.className = "birthday-empty";
      cell.textContent = "No saved students match your birthday filters.";
    }
    get("birthday-count").textContent = `${matches.length} ${matches.length === 1 ? "student" : "students"} found`;
    results.hidden = false;
    get("birthday-results-title").focus();
  }

  function update() {
    clearResults();
    syncForm();
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => {
    clearResults();
    queueMicrotask(syncForm);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncForm();
    if (!form.reportValidity()) return;
    clearResults();
    const version = revision;
    const { report, status } = Object.fromEntries(new FormData(form));
    const [start, end, selectedMonth] = [from.value, to.value, month.value];
    feedback.textContent = "Checking saved student records…";
    try {
      const records = await window.AdmissionRecords.readRecords();
      if (version !== revision) return;
      const matches = [];
      for (const record of records) {
        const state = String(record.status || "active").toLowerCase();
        if (!(state === status || status === "studying" && state === "active")) continue;
        if (typeof record.birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(record.birthDate)) continue;
        const birth = new Date(record.birthDate + "T00:00:00Z");
        if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== record.birthDate) continue;
        const monthDay = record.birthDate.slice(5);
        const date = report === "month"
          ? (monthDay.startsWith(selectedMonth + "-") ? `2000-${monthDay}` : "")
          : birthdayInRange(monthDay, start, end);
        if (date) matches.push({ record, date });
      }
      matches.sort((a, b) => a.date.localeCompare(b.date));
      feedback.textContent = "";
      render(matches);
    } catch {
      if (version === revision) feedback.textContent = "Saved student records could not be loaded in this browser.";
    }
  });
  syncForm();
})();
