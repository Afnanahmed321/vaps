(() => {
  const byId = (id) => document.getElementById(id);
  const { years, classes, sections, populate } = window.AdmissionOptions;
  const form = byId("allotment-form");
  const sourceYear = byId("source-year");
  const sourceClass = byId("source-class");
  const sourceSection = byId("source-section");
  const promotion = byId("promotion-years");
  const destinationYear = byId("destination-year");
  const destinationClass = byId("destination-class");
  const destinationSection = byId("destination-section");
  const feedback = byId("allotment-feedback");

  function setChoices(select, choices) {
    populate(select, choices);
    select.disabled = choices.length === 0;
  }

  function updateDestinationYear() {
    feedback.textContent = "";
    const academicYear = sourceYear.value.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
    const offset = promotion.valueAsNumber;
    const promotedYear = academicYear && promotion.validity.valid
      ? `${Number(academicYear[1]) + offset}-${Number(academicYear[2]) + offset}` : "";
    setChoices(destinationYear, promotedYear ? [promotedYear] : []);
    destinationYear.value = promotedYear;
    setChoices(destinationClass, promotedYear ? classes() : []);
    setChoices(destinationSection, []);
  }

  function updateSourceYear() {
    promotion.disabled = !sourceYear.value;
    setChoices(sourceClass, sourceYear.value ? classes() : []);
    setChoices(sourceSection, []);
    updateDestinationYear();
  }

  populate(sourceYear, years());
  sourceYear.addEventListener("change", updateSourceYear);
  promotion.addEventListener("input", updateDestinationYear);
  sourceClass.addEventListener("change", () => setChoices(sourceSection, sourceClass.value ? sections() : []));
  destinationClass.addEventListener("change", () => setChoices(destinationSection, destinationClass.value ? sections() : []));
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("change", () => {
    feedback.textContent = sourceSection.value && destinationSection.value
      ? "A connected student roster is required to load and transfer students." : "";
  });
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    sourceYear.value = "";
    promotion.value = "";
    feedback.textContent = "";
    updateSourceYear();
  });
})();
