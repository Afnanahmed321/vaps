(() => {
  const form = document.getElementById("daily-attendance-form");
  const { academicYear, attendanceDate, frequency } = form.elements;
  const result = document.getElementById("daily-result");
  const selection = document.getElementById("daily-selection");
  const { years, populate } = window.AdmissionOptions;

  populate(academicYear, years());
  attendanceDate.defaultValue = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata"
  }).format(new Date());

  const displayDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" });
  function clearResult() {
    result.hidden = true;
  }

  form.addEventListener("change", clearResult);
  form.addEventListener("reset", clearResult);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = displayDate.format(new Date(attendanceDate.value + "T00:00:00Z"));
    const filters = [academicYear.value, date];
    if (frequency) filters.push(frequency.value);
    selection.textContent = filters.join(" · ");
    result.hidden = false;
  });
})();
