(() => {
  const form = document.querySelector(".student-status-filters");
  const year = document.getElementById("student-status-year");
  const classSelect = document.getElementById("student-status-class");
  const section = document.getElementById("student-status-section");
  const feedback = document.getElementById("student-status-feedback");

  const { years, classes, sections, populate } = window.AdmissionOptions;

  function updateStatus() {
    feedback.textContent = "";
    if (year.value && classSelect.value && section.value) {
      const status = new FormData(form).get("student-status");
      feedback.textContent =
        `${status === "active" ? "Active" : "Deactive"} students · ${year.value} · Class ${classSelect.value} · Section ${section.value}. A connected student roster is required to display matching records.`;
    }
  }

  populate(year, years());
  year.addEventListener("change", () => {
    const choices = year.value ? classes() : [];
    populate(classSelect, choices);
    classSelect.disabled = !choices.length;
    populate(section, []);
    section.disabled = true;
  });
  classSelect.addEventListener("change", () => {
    const choices = classSelect.value ? sections() : [];
    populate(section, choices);
    section.disabled = !choices.length;
  });
  form.addEventListener("change", updateStatus);
})();
