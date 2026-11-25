(() => {
  const form = document.getElementById("yearly-attendance-form");
  const { academicYear, className, section } = form.elements;
  const sectionHint = document.getElementById("yearly-section-hint");
  const results = document.getElementById("yearly-results");
  const { years, classes, sections, populate } = window.AdmissionOptions;

  populate(academicYear, years());
  populate(className, classes());
  populate(section, sections());

  function updateSection() {
    section.value = "";
    section.disabled = !className.value;
    sectionHint.hidden = !section.disabled;
  }

  className.addEventListener("change", updateSection);
  academicYear.addEventListener("change", updateSection);
  form.addEventListener("change", () => results.replaceChildren());
  form.addEventListener("reset", () => {
    results.replaceChildren();
    queueMicrotask(updateSection);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const card = document.createElement("section");
    card.className = "master-card";
    const title = document.createElement("h2");
    title.textContent = "Yearly Attendance Results";
    const selection = document.createElement("p");
    selection.textContent = [academicYear.value, className.value, section.value].join(" · ");
    const message = document.createElement("p");
    message.textContent = "Connect an attendance data source to view yearly records.";
    card.append(title, selection, message);
    results.replaceChildren(card);
  });
})();
