(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("paper-config");
  const preview = byId("paper-preview");
  const configButton = byId("paper-config-button");
  const previewButton = byId("paper-preview-button");
  const rows = byId("paper-rows");
  const fileInput = byId("paper-file");
  const chapters = byId("paper-chapters");
  const feedback = byId("paper-feedback");
  const difficulty = ["easy", "medium", "hard"].map((level) => byId("paper-" + level));

  function showPreview(active) {
    form.hidden = active;
    preview.hidden = !active;
    configButton.classList.toggle("button-primary", !active);
    configButton.classList.toggle("button-secondary", active);
    previewButton.classList.toggle("button-primary", active);
    previewButton.classList.toggle("button-secondary", !active);
    configButton.setAttribute("aria-pressed", String(!active));
    previewButton.setAttribute("aria-pressed", String(active));
  }

  function recalculate() {
    let total = 0;
    Array.from(rows.rows).forEach((row, index) => {
      const [marks, count, mcq] = row.querySelectorAll("input");
      const section = `Section ${index + 1}`;
      marks.setAttribute("aria-label", `${section} mark value`);
      count.setAttribute("aria-label", `${section} number of questions`);
      mcq.setAttribute("aria-label", `${section} MCQ`);
      const subtotal = marks.validity.valid && count.validity.valid ? marks.valueAsNumber * count.valueAsNumber : 0;
      row.querySelector(".paper-subtotal").textContent = subtotal;
      const remove = row.querySelector(".paper-remove");
      remove.setAttribute("aria-label", `Remove ${section.toLowerCase()}`);
      remove.disabled = rows.rows.length === 1;
      total += subtotal;
    });
    byId("paper-total").textContent = total;

    const mix = difficulty.reduce((sum, slider) => {
      form.querySelector(`output[for="${slider.id}"]`).textContent = `${slider.value}%`;
      return sum + slider.valueAsNumber;
    }, 0);
    byId("paper-mix-total").textContent = `Total ${mix}%`;
    return mix;
  }

  function onConfigurationChange() {
    feedback.hidden = true;
    previewButton.disabled = true;
    recalculate();
  }

  function addSection(marks, count, mcq) {
    const row = rows.insertRow();
    row.innerHTML = `
      <td><input type="number" min="1" step="1" value="${marks}" required></td>
      <td><input type="number" min="1" step="1" value="${count}" required></td>
      <td><label class="paper-type"><input type="checkbox" ${mcq ? "checked" : ""}> MCQ</label></td>
      <td class="paper-subtotal"></td>
      <td><button class="button button-secondary paper-remove" type="button"><i data-lucide="trash-2" aria-hidden="true"></i></button></td>`;
    return row;
  }

  addSection(1, 5, true);
  addSection(2, 5, false);
  addSection(5, 2, false);
  recalculate();

  form.addEventListener("input", onConfigurationChange);
  byId("paper-add").addEventListener("click", () => {
    const row = addSection(1, 1, false);
    onConfigurationChange();
    window.lucide?.createIcons();
    row.querySelector("input").focus();
  });
  rows.addEventListener("click", (event) => {
    const remove = event.target.closest(".paper-remove");
    if (!remove || rows.rows.length === 1) return;
    const row = remove.closest("tr");
    const nextRow = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    onConfigurationChange();
    nextRow.querySelector("input").focus();
  });

  configButton.addEventListener("click", () => showPreview(false));
  previewButton.addEventListener("click", () => showPreview(true));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file || !/\.pdf$/i.test(file.name) || file.size === 0) {
      feedback.textContent = "Choose a non-empty PDF textbook.";
      feedback.hidden = false;
      fileInput.focus();
      return;
    }
    if (recalculate() !== 100) {
      feedback.textContent = "The difficulty percentages must add up to 100%.";
      feedback.hidden = false;
      difficulty[0].focus();
      return;
    }

    byId("paper-preview-source").textContent =
      `${file.name} · Chapters ${chapters.value} · ${byId("paper-total").textContent} marks`;
    byId("paper-preview-mix").textContent = difficulty.map((slider) =>
      slider.labels[0].textContent
    ).join(" · ");

    const sections = document.createElement("ol");
    for (const row of rows.rows) {
      const [marks, count, mcq] = row.querySelectorAll("input");
      const item = document.createElement("li");
      const questionLabel = count.valueAsNumber === 1 ? "question" : "questions";
      item.textContent = `${count.value} ${mcq.checked ? "multiple-choice" : "written-response"} ${questionLabel} × ${marks.value} marks each`;
      sections.append(item);
    }
    byId("paper-preview-sections").replaceChildren(sections);
    previewButton.disabled = false;
    showPreview(true);
    byId("paper-preview-title").focus();
  });
})();
