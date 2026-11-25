(() => {
  const fileInput = document.getElementById("performance-file");
  const selectButton = document.getElementById("performance-select");
  const feedback = document.getElementById("performance-feedback");

  selectButton.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      feedback.textContent = "";
      feedback.classList.remove("is-error");
      return;
    }

    const isValid = /\.(pdf|csv|xlsx|xls)$/i.test(file.name) && file.size > 0;
    feedback.classList.toggle("is-error", !isValid);
    if (!isValid) {
      feedback.textContent = "Choose a non-empty PDF, CSV, or Excel report.";
      fileInput.value = "";
      return;
    }

    feedback.textContent = `Selected ${file.name}. Report analysis requires a connected service.`;
  });
})();
