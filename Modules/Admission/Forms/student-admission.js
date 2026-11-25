(() => {
  const get = (id) => document.getElementById(id);
  const { years, classes, sections, populate } = window.AdmissionOptions;
  const form = get("admission-form");
  const list = get("admission-list");
  const editor = get("admission-editor");
  const filter = get("admission-year-filter");
  const search = get("admission-search");
  const size = get("admission-size");
  const rows = get("admission-rows");
  const listStatus = get("admission-list-status");
  const formStatus = get("admission-form-status");
  const panels = [...form.querySelectorAll("[data-panel]")];
  const steps = [...form.querySelectorAll("[data-step]")];
  const sortButtons = [...list.querySelectorAll("[data-sort]")];
  const pager = [...list.querySelectorAll("[data-page]")];
  const photo = get("ad-photo");
  const documents = get("ad-documents");
  const controls = [...form.querySelectorAll("[name]")];
  const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const objectUrls = [];
  let records = [];
  let editing = null;
  let opener = null;
  let previewUrl = "";
  let step = 0;
  let page = 1;
  let lastPage = 1;
  let sort = "serial";
  let direction = 1;
  let saving = false;

  const { readRecords, writeRecord } = window.AdmissionRecords;

  function masterNames(key, defaults, predicate = () => true) {
    try {
      const values = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(values)) {
        return values.filter((record) => record && record.active !== false && predicate(record))
          .map((record) => record.name);
      }
    } catch {}
    return defaults;
  }

  function name(record) {
    return [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  }

  function textButton(text, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary";
    button.textContent = text;
    button.addEventListener("click", callback);
    return button;
  }

  function render() {
    for (const url of objectUrls.splice(0)) URL.revokeObjectURL(url);
    const query = search.value.trim().toLowerCase();
    const matches = records.filter((record) => record.year === filter.value &&
      [name(record), record.className, record.section, record.admissionDate, record.gender,
        record.admissionNo, record.email, record.mobile].some((value) => String(value ?? "").toLowerCase().includes(query)));
    const value = (record) => sort === "name" ? name(record) : record[sort];
    matches.sort((a, b) => direction * String(value(a)).localeCompare(String(value(b)), undefined, { numeric: true }));
    const count = Number(size.value);
    lastPage = Math.max(1, Math.ceil(matches.length / count));
    page = Math.min(lastPage, Math.max(1, page));
    const start = (page - 1) * count;
    rows.replaceChildren();
    for (const record of matches.slice(start, start + count)) {
      const row = rows.insertRow();
      row.insertCell().textContent = record.serial;
      row.insertCell().append(textButton(name(record), () => openProfile(record)));
      for (const key of ["className", "section", "admissionDate", "gender", "admissionNo", "email", "mobile"]) {
        row.insertCell().textContent = record[key] || "—";
      }
      const imageCell = row.insertCell();
      if (record.photo) {
        const image = document.createElement("img");
        image.alt = "";
        image.src = URL.createObjectURL(record.photo);
        objectUrls.push(image.src);
        imageCell.append(image);
      } else imageCell.textContent = "—";
      row.insertCell().append(textButton("Edit", (event) => openEditor(record, event.currentTarget)));
    }
    if (!matches.length) {
      const empty = rows.insertRow().insertCell();
      empty.colSpan = 11;
      empty.className = "admission-empty";
      empty.textContent = "No results.";
    }
    get("admission-range").textContent = matches.length
      ? `Showing ${start + 1} to ${Math.min(start + count, matches.length)} of ${matches.length} entries`
      : "No entries found";
    for (const button of pager) {
      button.disabled = ["first", "prev"].includes(button.dataset.page) ? page === 1 : page === lastPage;
    }
    for (const button of sortButtons) {
      button.closest("th").setAttribute("aria-sort", button.dataset.sort === sort
        ? (direction === 1 ? "ascending" : "descending") : "none");
    }
  }

  function setupYears(selected = filter.value) {
    const options = new Set(["2008-2009", ...years(), ...records.map((record) => record.year)]);
    filter.replaceChildren(...Array.from(options, (year) => new Option(year, year)));
    if (options.has(selected)) filter.value = selected;
  }

  function openProfile(record) {
    const details = get("admission-profile-fields");
    details.replaceChildren();
    get("admission-profile-title").textContent = name(record);
    for (const control of controls) {
      const value = record[control.name];
      if (!value) continue;
      const group = document.createElement("div");
      const label = document.createElement("dt");
      label.textContent = control.labels[0].textContent.replace(/\s*\*$/, "");
      const description = document.createElement("dd");
      description.textContent = value instanceof File ? value.name
        : Array.isArray(value) ? value.map((file) => file.name).join(", ")
        : value === true ? "Yes" : value;
      if (!description.textContent) continue;
      group.append(label, description);
      details.append(group);
    }
    get("admission-profile").showModal();
  }

  function showPhoto(file) {
    const image = get("admission-photo-preview");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = file ? URL.createObjectURL(file) : "";
    image.hidden = !previewUrl;
    if (previewUrl) image.src = previewUrl;
    else image.removeAttribute("src");
  }

  function fill(key, options, selected = "") {
    const select = get("ad-" + key);
    populate(select, selected ? [...options, selected] : options);
    select.value = selected;
  }

  function fillCastes(selected = "") {
    const category = get("ad-casteCategory").value;
    const initial = category === "GENERAL" ? ["ADI DRAVIDA", "ADI KARNATAKA", "AGAMUDI", "BAJANTHRI",
      "BALAJIGA", "BANAJIGA", "YADAVA", "BESTA", "VANNIYAR", "VANNIKULAKSHATRIYA"] : [];
    const options = masterNames("vaps.admission.masterCastes", initial, (record) => record.category === category);
    get("ad-caste-options").replaceChildren(...Array.from(new Set(options), (value) => new Option(value, value)));
    get("ad-caste").value = selected;
  }

  function openEditor(record, trigger) {
    editing = record;
    opener = trigger;
    form.reset();
    form.querySelectorAll(".admission-optional").forEach((section) => { section.open = false; });
    formStatus.textContent = "";
    photo.required = !record?.photo;
    photo.setCustomValidity("");
    get("ad-birthDate").setCustomValidity("");
    fill("year", [...years(), ...Array.from(filter.options, (option) => option.value)], record?.year || filter.value);
    fill("className", classes(), record?.className);
    fill("section", sections(), record?.section);
    fill("religion", masterNames("vaps.admission.masterReligions", ["Hindu", "CHRISTIAN", "OTHER"]), record?.religion);
    fill("casteCategory", masterNames("vaps.admission.casteCategories", ["GENERAL", "3A", "3B", "SC", "ST", "ADI KARNATAKA", "2A", "2B", "OBC", "BHARAMAN"]), record?.casteCategory);
    fillCastes(record?.caste);
    fill("studentCategory", masterNames("vaps.admission.masterCategories", ["Primary School", "Middle School", "High School", "Pre Primary School"]), record?.studentCategory);
    if (record) {
      for (const control of controls) {
        if (control.type === "file") continue;
        if (control.type === "checkbox") control.checked = Boolean(record[control.name]);
        else if (record[control.name] != null) control.value = record[control.name];
      }
    }
    showPhoto(record?.photo);
    get("admission-editor-title").textContent = record ? "Edit Admission Form" : "Add New Admission Form";
    list.hidden = true;
    editor.hidden = false;
    showStep(0);
    get("admission-editor-title").focus();
  }

  function closeEditor() {
    showPhoto(null);
    form.reset();
    editor.hidden = true;
    list.hidden = false;
    (opener?.isConnected ? opener : get("admission-add")).focus();
    opener = null;
  }

  function showStep(index, focus = false) {
    step = index;
    get("admission-step-progress").textContent = `Step ${index + 1} of ${panels.length}`;
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    steps.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    get("admission-back").disabled = index === 0;
    get("admission-next").hidden = index === panels.length - 1;
    get("admission-save").hidden = index !== panels.length - 1;
    if (focus) panels[index].querySelector("h3").focus();
  }

  function updateBirth() {
    const birth = get("ad-birthDate");
    const admission = get("ad-admissionDate").value;
    birth.setCustomValidity(birth.value && admission && birth.value > admission ? "Date of birth must be on or before the admission date." : "");
    const [year, month, day] = birth.value.split("-").map(Number);
    get("ad-birthWords").value = birth.value ? new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day))) : "";
    const [toYear, toMonth, toDay] = admission.split("-").map(Number);
    get("ad-age").value = birth.value && admission && birth.validity.valid
      ? toYear - year - Number(toMonth < month || toMonth === month && toDay < day) : "";
  }

  function checkPanel(index) {
    const invalid = [...panels[index].querySelectorAll("input, select, textarea")].find((field) => !field.validity.valid);
    if (!invalid) return true;
    showStep(index);
    const group = invalid.closest("details");
    if (group) group.open = true;
    invalid.reportValidity();
    return false;
  }

  get("admission-add").addEventListener("click", (event) => openEditor(null, event.currentTarget));
  get("admission-close").addEventListener("click", closeEditor);
  get("admission-back").addEventListener("click", () => showStep(step - 1, true));
  get("admission-next").addEventListener("click", () => {
    if (checkPanel(step)) showStep(step + 1, true);
  });
  steps.forEach((button, index) => button.addEventListener("click", () => {
    if (!saving) showStep(index, true);
  }));
  get("ad-birthDate").addEventListener("change", updateBirth);
  get("ad-admissionDate").addEventListener("change", updateBirth);
  get("ad-casteCategory").addEventListener("change", () => fillCastes());
  photo.addEventListener("change", () => {
    const file = photo.files[0];
    const valid = !file || photoTypes.has(file.type) && file.size > 0;
    photo.setCustomValidity(valid ? "" : "Select a JPEG, PNG, or WebP photo.");
    showPhoto(valid && file ? file : editing?.photo);
    if (!valid) photo.reportValidity();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (saving) return;
    updateBirth();
    for (let i = 0; i < panels.length; i += 1) {
      if (!checkPanel(i)) return;
    }

    const record = {};
    for (const control of controls) {
      if (control.type === "checkbox") record[control.name] = control.checked;
      else if (control.type !== "file") record[control.name] = control.value.trim();
    }
    const blank = controls.find((control) => control.required && control.type !== "file" && !record[control.name]);
    if (blank) {
      showStep(Number(blank.closest("[data-panel]").dataset.panel));
      formStatus.textContent = "Complete the required fields.";
      blank.focus();
      return;
    }
    record.photo = photo.files[0] || editing?.photo;
    record.documents = documents.files.length ? [...documents.files] : editing?.documents || [];
    if (editing) record.serial = editing.serial;
    saving = true;
    get("admission-save").disabled = true;
    get("admission-close").disabled = true;
    get("admission-back").disabled = true;
    formStatus.textContent = "Saving admission…";
    try {
      record.serial = await writeRecord(record);
      records = records.filter((item) => item.serial !== record.serial).concat(record);
      setupYears(record.year);
      page = 1;
      search.value = "";
      render();
      closeEditor();
      listStatus.textContent = "Admission saved in this browser.";
    } catch (error) {
      formStatus.textContent = error?.name === "ConstraintError"
        ? "This admission number already exists for the selected academic year."
        : "The admission could not be saved in this browser.";
    } finally {
      saving = false;
      get("admission-save").disabled = false;
      get("admission-close").disabled = false;
      get("admission-back").disabled = step === 0;
    }
  });

  function resetPage() { page = 1; render(); }
  filter.addEventListener("change", resetPage);
  search.addEventListener("input", resetPage);
  size.addEventListener("change", resetPage);
  for (const button of sortButtons) button.addEventListener("click", () => {
    direction = sort === button.dataset.sort ? -direction : 1;
    sort = button.dataset.sort;
    resetPage();
  });
  for (const button of pager) button.addEventListener("click", () => {
    page = { first: 1, prev: page - 1, next: page + 1, last: lastPage }[button.dataset.page];
    render();
  });

  setupYears("2008-2009");
  readRecords().then((saved) => {
    records = saved;
    setupYears();
    render();
  }).catch(() => { listStatus.textContent = "Saved admissions could not be loaded in this browser."; });
})();
