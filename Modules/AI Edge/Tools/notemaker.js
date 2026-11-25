(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("notes-config");
  const preview = byId("notes-preview");
  const configButton = byId("notes-config-button");
  const previewButton = byId("notes-preview-button");
  const fileInput = byId("notes-file");
  const chapter = byId("notes-chapter");
  const feedback = byId("notes-feedback");
  const formats = Array.from(form.querySelectorAll('input[type="checkbox"]'));

  function showPreview(active) {
    form.hidden = active;
    preview.hidden = !active;
    for (const [button, selected] of [[configButton, !active], [previewButton, active]]) {
      button.classList.toggle("button-primary", selected);
      button.classList.toggle("button-secondary", !selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  }

  function showError(message, field) {
    feedback.textContent = message;
    feedback.hidden = false;
    field.focus();
  }

  configButton.addEventListener("click", () => showPreview(false));
  previewButton.addEventListener("click", () => showPreview(true));

  form.addEventListener("input", () => {
    feedback.hidden = true;
    previewButton.disabled = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file || !/\.pdf$/i.test(file.name) || file.size === 0) {
      showError("Choose a non-empty PDF textbook.", fileInput);
      return;
    }

    const selected = formats.filter((format) => format.checked);
    if (!selected.length) {
      showError("Choose at least one note format.", formats[0]);
      return;
    }

    byId("notes-preview-source").textContent = `${file.name} · Chapter ${chapter.value}`;
    byId("notes-preview-formats").replaceChildren(...selected.map((format) => {
      const item = document.createElement("li");
      item.textContent = format.value;
      return item;
    }));
    previewButton.disabled = false;
    showPreview(true);
    byId("notes-preview-title").focus();
  });
})();
