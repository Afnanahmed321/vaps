(() => {
  const get = (id) => document.getElementById(id);
  const { years, populate } = window.AdmissionOptions;
  const form = get("tc-form");
  const year = get("tc-year");
  const search = get("tc-search");
  const student = get("tc-student");
  const list = get("tc-matches");
  const feedback = get("tc-feedback");
  let records = [];
  let loadFailed = false;

  function render() {
    const settings = new FormData(form);
    const individual = settings.get("scope") === "individual";
    const temporary = settings.has("temporary");
    const nameFirst = settings.get("display") === "name";
    const enrollment = settings.get("status");
    const previous = student.value;
    const query = search.value.trim().toLowerCase();
    const matches = records.filter((record) => record.year === year.value &&
      (record.status || "active").toLowerCase() === enrollment)
      .map((record) => {
        const name = [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
        const label = nameFirst ? `${name} · ${record.admissionNo}` : `${record.admissionNo} · ${name}`;
        return { id: String(record.serial), label };
      })
      .filter(({ label }) => label.toLowerCase().includes(query))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

    search.disabled = !year.value || loadFailed;
    get("tc-student-field").hidden = !individual;
    populate(student, []);
    for (const { id, label } of matches) student.add(new Option(label, id));
    student.value = matches.some(({ id }) => id === previous) ? previous : "";
    student.disabled = !individual || !matches.length;
    list.hidden = individual || !matches.length;
    list.replaceChildren();
    if (!list.hidden) {
      for (const { label } of matches) {
        const item = document.createElement("li");
        item.textContent = label;
        list.append(item);
      }
    }

    if (loadFailed) feedback.textContent = "Saved admissions could not be loaded in this browser.";
    else if (!year.value) feedback.textContent = "Select an academic year to see students.";
    else if (!matches.length) feedback.textContent = "No saved students match these filters.";
    else if (individual && !student.value) feedback.textContent = "Select a student from the matching records.";
    else {
      const scope = individual ? student.selectedOptions[0].textContent : `${matches.length} matching ${matches.length === 1 ? "student" : "students"}`;
      feedback.textContent = `${scope} · ${temporary ? "Temporary TC" : "Transfer Certificate"}. Issuing certificates requires a connected service.`;
    }
  }

  populate(year, years());
  year.addEventListener("change", () => {
    search.value = "";
    student.value = "";
  });
  form.addEventListener("change", render);
  search.addEventListener("input", render);
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("reset", () => queueMicrotask(render));

  window.AdmissionRecords.readRecords().then((saved) => {
    records = saved;
    const selected = year.value;
    populate(year, [...years(), ...records.map((record) => record.year)]);
    year.value = selected;
  }).catch(() => { loadFailed = true; }).finally(render);
})();
