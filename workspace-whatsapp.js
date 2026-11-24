(() => {
  const appsMenu = document.querySelector(".intelligent-apps-menu");
  if (!appsMenu) return;
  const artworkUrl = new URL("assets/whatsapp-sender.png", document.currentScript.src).href;

  const dialog = document.createElement("dialog");
  dialog.className = "whatsapp-dialog intelligent-app-dialog";
  dialog.setAttribute("aria-labelledby", "whatsapp-dialog-title");
  dialog.innerHTML = `
    <form class="whatsapp-window" id="whatsapp-form">
      <aside class="whatsapp-side" aria-hidden="true">
        <div class="whatsapp-side-brand">YOUR SCHOOL<br>ASSISTANT</div>
        <span class="whatsapp-side-accent"></span>
        <h3>WhatsApp<br>Sender</h3>
        <div class="whatsapp-side-art"><img src="${artworkUrl}" alt="WhatsApp message on a phone" /></div>
      </aside>
      <div class="whatsapp-main">
        <header class="whatsapp-header intelligent-app-header">
          <div class="whatsapp-heading-copy">
            <p><i data-lucide="message-circle" aria-hidden="true"></i> INTELLIGENT APPS</p>
            <h2 id="whatsapp-dialog-title">WhatsApp Sender</h2>
            <span>Send template messages to your school community.</span>
          </div>
          <button class="whatsapp-close intelligent-app-close" type="button" aria-label="Close WhatsApp Sender"><i data-lucide="x" aria-hidden="true"></i></button>
        </header>
      <div class="whatsapp-body">
        <div class="whatsapp-mode-switch" role="tablist" aria-label="Message type">
          <button class="is-active" type="button" role="tab" aria-selected="true" aria-controls="whatsapp-single" data-whatsapp-mode="single">Single Message</button>
          <button type="button" role="tab" aria-selected="false" aria-controls="whatsapp-bulk" data-whatsapp-mode="bulk">Bulk Messaging</button>
        </div>
        <div class="whatsapp-type-field">
          <label for="whatsapp-type"><i data-lucide="tag" aria-hidden="true"></i> Type</label>
          <select id="whatsapp-type" name="type">
            <option>Birthday</option><option>Attendance</option><option>Fee Due</option><option>General</option>
          </select>
        </div>
        <section class="whatsapp-fields" id="whatsapp-single" role="tabpanel">
          <label class="whatsapp-field"><span><i data-lucide="smartphone" aria-hidden="true"></i> Mobile</span><input name="mobile" type="tel" placeholder="Number (e.g. 9199...)" autocomplete="tel" /></label>
          <label class="whatsapp-field"><span><i data-lucide="user-round" aria-hidden="true"></i> Name</span><input name="name" type="text" autocomplete="name" /></label>
          <label class="whatsapp-field"><span><i data-lucide="landmark" aria-hidden="true"></i> Institute</span><input name="institute" type="text" /></label>
        </section>
        <section class="whatsapp-bulk" id="whatsapp-bulk" role="tabpanel" hidden>
          <label class="whatsapp-section-label" for="whatsapp-file">Upload Excel sheet</label>
          <label class="whatsapp-upload" for="whatsapp-file" tabindex="0">
            <input id="whatsapp-file" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
            <span class="whatsapp-upload-icon"><i data-lucide="upload" aria-hidden="true"></i></span>
            <strong class="whatsapp-upload-title">Choose a file or drag it here</strong>
            <small class="whatsapp-upload-hint">Excel files (.xlsx, .xls)</small>
          </label>
          <div class="whatsapp-required-columns">
            <strong>Required columns</strong>
            <div><span>MobileNumber</span><span>Name</span><span>Institute</span><span>Attendance</span><span>FeeDue</span><span>Credentials</span></div>
            <small>MobileNumber is required for all messages.</small>
          </div>
        </section>
        <p class="whatsapp-feedback" id="whatsapp-feedback" role="status" aria-live="polite" hidden></p>
      </div>
      <footer class="whatsapp-footer">
        <button class="whatsapp-send intelligent-app-primary" type="submit">Send Message <i data-lucide="arrow-right" aria-hidden="true"></i></button>
      </footer>
      </div>
    </form>`;
  document.body.append(dialog);

  if (window.lucide) window.lucide.createIcons();

  const form = dialog.querySelector("#whatsapp-form");
  const closeButton = dialog.querySelector(".whatsapp-close");
  const modeButtons = [...dialog.querySelectorAll("[data-whatsapp-mode]")];
  const singlePanel = dialog.querySelector("#whatsapp-single");
  const bulkPanel = dialog.querySelector("#whatsapp-bulk");
  const sendButton = dialog.querySelector(".whatsapp-send");
  const feedback = dialog.querySelector("#whatsapp-feedback");
  const upload = dialog.querySelector(".whatsapp-upload");
  const fileInput = dialog.querySelector("#whatsapp-file");
  const uploadTitle = dialog.querySelector(".whatsapp-upload-title");
  const uploadHint = dialog.querySelector(".whatsapp-upload-hint");

  function setMode(mode) {
    const bulk = mode === "bulk";
    modeButtons.forEach((button) => {
      const selected = button.dataset.whatsappMode === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    singlePanel.hidden = bulk;
    bulkPanel.hidden = !bulk;
    sendButton.innerHTML = bulk
      ? 'Send Bulk Messages <i data-lucide="arrow-right" aria-hidden="true"></i>'
      : 'Send Message <i data-lucide="arrow-right" aria-hidden="true"></i>';
    feedback.hidden = true;
    if (window.lucide) window.lucide.createIcons();
  }

  function openWhatsApp() {
    dialog.showModal();
    setMode("single");
    const dropdown = document.querySelector(".intelligent-apps-dropdown");
    dropdown?.setAttribute("data-open", "false");
    dropdown?.querySelector(".top-pill")?.setAttribute("aria-expanded", "false");
  }

  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.whatsappMode)));
  appsMenu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (item?.textContent.trim().toLowerCase() !== "whatsapp") return;
    event.preventDefault();
    openWhatsApp();
  });
  document.getElementById("quick-open-whatsapp")?.addEventListener("click", openWhatsApp);

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    uploadTitle.textContent = file ? file.name : "Choose a file or drag it here";
    uploadHint.textContent = file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : "Excel files (.xlsx, .xls)";
    upload.classList.toggle("has-file", Boolean(file));
  });

  upload.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  ["dragenter", "dragover"].forEach((name) => upload.addEventListener(name, (event) => {
    event.preventDefault();
    upload.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((name) => upload.addEventListener(name, (event) => {
    event.preventDefault();
    upload.classList.remove("is-dragging");
  }));
  upload.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file || !/\.xlsx?$/i.test(file.name)) {
      uploadHint.textContent = "Please choose an .xlsx or .xls file.";
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    feedback.textContent = "WhatsApp message delivery is not connected yet.";
    feedback.hidden = false;
  });
})();
