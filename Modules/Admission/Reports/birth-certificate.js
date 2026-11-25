(() => {
  const get = (id) => document.getElementById("birth-certificate-" + id);
  const { years, populate } = window.AdmissionOptions;
  const form = get("form");
  const year = get("year");
  const classSelect = get("class");
  const section = get("section");
  const student = get("student");
  const feedback = get("feedback");
  const dateFormat = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  });
  let records = [];
  let loadError = false;

  function studentName(record) {
    return [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  }

  function eligible() {
    return records.filter((record) => record.year === year.value &&
      record.className === classSelect.value && record.section === section.value);
  }

  function choices(select, values) {
    const options = values.filter(Boolean);
    populate(select, options);
    select.disabled = !options.length;
  }

  function updateFeedback() {
    get("generate").disabled = !student.value;
    if (loadError) feedback.textContent = "Saved admissions could not be loaded in this browser.";
    else if (!records.length) feedback.textContent = "No admissions are saved in this browser.";
    else if (!year.value) feedback.textContent = "Select an academic year to begin.";
    else if (classSelect.disabled) feedback.textContent = "No student admissions are saved for this academic year.";
    else if (!classSelect.value) feedback.textContent = "Select a class.";
    else if (!section.value) feedback.textContent = section.disabled ? "No sections are saved for this class." : "Select a section.";
    else feedback.textContent = student.value ? "" : "Select a student from this section.";
  }

  function updateStudents() {
    const matches = eligible();
    populate(student, []);
    if (section.value) {
      for (const record of matches) student.add(new Option(`${studentName(record)} · ${record.admissionNo}`, String(record.serial)));
    }
    student.disabled = student.options.length === 1;
    updateFeedback();
  }

  function updateSections() {
    choices(section, classSelect.value ? records.filter((record) =>
      record.year === year.value && record.className === classSelect.value).map((record) => record.section) : []);
    updateStudents();
  }

  function updateClasses() {
    choices(classSelect, year.value ? records.filter((record) => record.year === year.value).map((record) => record.className) : []);
    updateSections();
  }

  year.addEventListener("change", updateClasses);
  classSelect.addEventListener("change", updateSections);
  section.addEventListener("change", updateStudents);
  student.addEventListener("change", updateFeedback);
  form.addEventListener("reset", () => queueMicrotask(updateClasses));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const record = eligible().find((entry) => String(entry.serial) === student.value);
    if (!record) return;
    const birthDate = new Date(record.birthDate + "T00:00:00Z");
    if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== record.birthDate) {
      feedback.textContent = "This admission record needs a valid date of birth before a report can be generated.";
      return;
    }
    const details = get("details");
    details.replaceChildren();
    for (const [title, value] of [
      ["Student name", studentName(record)], ["Admission number", record.admissionNo],
      ["Date of birth", dateFormat.format(birthDate)], ["Academic year", record.year],
      ["Class", record.className], ["Section", record.section], ["Purpose", get("purpose").value.trim()]
    ]) {
      if (!value) continue;
      const group = document.createElement("div");
      const label = document.createElement("dt");
      const text = document.createElement("dd");
      label.textContent = title;
      text.textContent = value;
      group.append(label, text);
      details.append(group);
    }
    get("preview").showModal();
  });
  get("print").addEventListener("click", () => window.print());

  window.AdmissionRecords.readRecords().then((saved) => { records = saved; })
    .catch(() => { loadError = true; })
    .finally(() => {
      choices(year, loadError ? [] : [...years(), ...records.map((record) => record.year)]);
      updateClasses();
    });
})();
