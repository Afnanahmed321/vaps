(() => {
  const input = document.getElementById("admission-import-file");
  const drop = document.getElementById("admission-import-drop");
  const status = document.getElementById("admission-import-status");
  const modes = [...document.querySelectorAll('input[name="import-scope"]')];
  let selectedFile = null;

  function showSelection() {
    if (!selectedFile) return;
    const mode = modes.find((option) => option.checked).value;
    status.textContent = `Selected ${selectedFile.name} · ${mode}. Importing student records requires a connected service.`;
  }

  function select(files) {
    if (!files.length) return;
    selectedFile = null;
    const file = files[0];
    const valid = files.length === 1 && /\.xlsx$/i.test(file.name) && file.size > 0;
    status.classList.toggle("is-error", !valid);
    if (!valid) {
      status.textContent = "Select one non-empty .xlsx workbook.";
      return;
    }
    selectedFile = file;
    showSelection();
  }

  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    select(input.files);
    input.value = "";
  });
  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("is-dragging");
  });
  drop.addEventListener("dragleave", (event) => {
    if (!drop.contains(event.relatedTarget)) drop.classList.remove("is-dragging");
  });
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
    select(event.dataTransfer.files);
  });
  for (const mode of modes) mode.addEventListener("change", showSelection);
})();
