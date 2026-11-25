(() => {
  const byId = (id) => document.getElementById(id);
  const get = (id) => byId("study-" + id);
  const { years, populate } = window.AdmissionOptions;
  const form = get("certificate-form");
  const year = get("year");
  const classSelect = get("class");
  const section = get("section");
  const date = get("date");
  const search = get("search");
  const student = get("student");
  const feedback = get("feedback");
  const preview = get("certificate-preview");
  const documentBody = get("certificate-details");
  const today = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata"
  }).format(new Date());
  date.defaultValue = today;
  const dateFormat = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  });
  let records = [];
  let loading = true;
  let loadError = false;
  year.disabled = true;

  function setting(name) {
    return new FormData(form).get(name);
  }

  function studentName(record) {
    return [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  }

  function statusMatches(record, status) {
    const current = String(record.status || "active").toLowerCase();
    return current === status || status === "studying" && current === "active";
  }

  function matchingStudents() {
    if (!year.value || !classSelect.value || !section.value) return [];
    const status = setting("status");
    return records.filter((record) => record.year === year.value && record.className === classSelect.value &&
      record.section === section.value && statusMatches(record, status));
  }

  function invalidateReport() {
    documentBody.replaceChildren();
    get("print").disabled = true;
  }

  function updateStudents() {
    const previous = student.value;
    const individual = setting("scope") === "individual";
    const matches = matchingStudents();
    const term = search.value.trim().toLowerCase();
    populate(student, []);
    if (individual) {
      for (const record of matches) {
        const label = `${studentName(record)} · ${record.admissionNo}`;
        if (label.toLowerCase().includes(term)) student.add(new Option(label, String(record.serial)));
      }
      if ([...student.options].some((option) => option.value === previous)) student.value = previous;
    }
    get("student-field").hidden = !individual;
    student.disabled = !individual || student.options.length === 1;
    search.disabled = !individual || !section.value;
    get("report").disabled = !matches.length || individual && !student.value;
    if (loading) feedback.textContent = "Loading saved admissions…";
    else if (loadError) feedback.textContent = "Saved admissions could not be loaded.";
    else if (!records.length) feedback.textContent = "No admissions are saved in this browser.";
    else if (!section.value) feedback.textContent = "Choose an academic year, class, and section.";
    else if (!matches.length) feedback.textContent = "No students match this section and status.";
    else if (individual) feedback.textContent = student.value ? "" : "Select a matching student.";
    else feedback.textContent = `${matches.length} eligible ${matches.length === 1 ? "student" : "students"}.`;
  }

  function updateSections() {
    populate(section, records.filter((record) => record.year === year.value && record.className === classSelect.value)
      .map((record) => record.section).filter(Boolean));
    section.disabled = !classSelect.value || section.options.length === 1;
    updateStudents();
  }

  function updateClasses() {
    populate(classSelect, records.filter((record) => record.year === year.value).map((record) => record.className).filter(Boolean));
    classSelect.disabled = !year.value || classSelect.options.length === 1;
    updateSections();
  }

  function lookupCode() {
    const code = get("qr").value.trim().toLowerCase();
    if (!code) {
      feedback.textContent = "Scan or enter an admission number first.";
      get("qr").focus();
      return;
    }
    const status = setting("status");
    const matches = records.filter((record) => String(record.admissionNo).toLowerCase() === code &&
      (!year.value || record.year === year.value) && statusMatches(record, status));
    if (matches.length !== 1) {
      feedback.textContent = matches.length
        ? "This number appears in more than one year. Select the year and try again."
        : "No matching admission number was found for the selected year and status.";
      return;
    }
    const [record] = matches;
    form.elements.namedItem("scope").value = "individual";
    search.value = "";
    year.value = record.year;
    updateClasses();
    classSelect.value = record.className;
    updateSections();
    section.value = record.section;
    updateStudents();
    student.value = String(record.serial);
    invalidateReport();
    updateStudents();
    student.focus();
  }

  year.addEventListener("change", updateClasses);
  classSelect.addEventListener("change", updateSections);
  section.addEventListener("change", updateStudents);
  search.addEventListener("input", updateStudents);
  form.addEventListener("change", () => { invalidateReport(); updateStudents(); });
  get("qr-lookup").addEventListener("click", lookupCode);
  get("qr").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    lookupCode();
  });
  form.addEventListener("reset", () => {
    invalidateReport();
    queueMicrotask(updateClasses);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const individuals = setting("scope") === "individual";
    const matches = matchingStudents().filter((record) => !individuals || String(record.serial) === student.value);
    const reportDate = date.valueAsDate;
    if (!matches.length || !reportDate) return;
    documentBody.replaceChildren();
    const type = setting("type");
    const address = setting("address");
    get("certificate-document-title").textContent = type + " Report";
    for (const record of matches) {
      const entry = document.createElement("section");
      const heading = document.createElement("h4");
      heading.textContent = studentName(record);
      const details = document.createElement("dl");
      for (const [label, value] of [
        ["Admission number", record.admissionNo], ["Academic year", record.year],
        ["Class", record.className], ["Section", record.section],
        ["Report date", dateFormat.format(reportDate)],
        [address === "permanent" ? "Permanent address" : "Communication address", record[address]]
      ]) {
        const group = document.createElement("div");
        const term = document.createElement("dt");
        const definition = document.createElement("dd");
        term.textContent = label;
        definition.textContent = value || "—";
        group.append(term, definition);
        details.append(group);
      }
      entry.append(heading, details);
      documentBody.append(entry);
    }
    get("print").disabled = false;
    preview.showModal();
  });

  get("certificate-preview-print").addEventListener("click", () => window.print());
  get("print").addEventListener("click", () => {
    if (!preview.open) preview.showModal();
    window.print();
  });

  window.AdmissionRecords.readRecords().then((saved) => { records = saved; })
    .catch(() => { loadError = true; })
    .finally(() => {
      loading = false;
      populate(year, [...years(), ...records.map((record) => record.year).filter(Boolean)]);
      year.disabled = loadError;
      updateClasses();
    });
  updateStudents();
})();
