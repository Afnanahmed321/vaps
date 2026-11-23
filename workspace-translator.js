(() => {
  const appsMenu = document.querySelector(".intelligent-apps-menu");
  if (!appsMenu) return;

  const dialog = document.createElement("dialog");
  dialog.className = "workspace-translator-dialog";
  dialog.setAttribute("aria-labelledby", "workspace-translator-title");
  dialog.innerHTML = `
    <form class="workspace-translator-window" id="workspace-translator-form">
      <header class="workspace-translator-header">
        <span class="workspace-translator-mark"><i data-lucide="languages" aria-hidden="true"></i></span>
        <div><p>INTELLIGENT APPS</p><h2 id="workspace-translator-title">Language Translator</h2><small>Translate text between languages.</small></div>
        <button class="workspace-translator-close" type="button" aria-label="Close Language Translator"><i data-lucide="x" aria-hidden="true"></i></button>
      </header>
      <div class="workspace-translator-body">
        <label class="workspace-translator-field"><span>Text to translate</span><textarea id="workspace-translator-source" placeholder="Enter text here..."></textarea></label>
        <label class="workspace-translator-field"><span>Translated text</span><output id="workspace-translator-result" aria-live="polite">Translation will appear here...</output></label>
        <div class="workspace-translator-languages">
          <label><span>From</span><select id="workspace-translator-from"><option>English</option><option>French</option><option>Spanish</option><option>German</option><option>Hindi</option><option>Tamil</option><option>Arabic</option><option>Mandarin Chinese</option></select></label>
          <button class="workspace-translator-swap" type="button" aria-label="Swap languages"><i data-lucide="arrow-left-right" aria-hidden="true"></i></button>
          <label><span>To</span><select id="workspace-translator-to"><option>French</option><option>English</option><option>Spanish</option><option>German</option><option>Hindi</option><option>Tamil</option><option>Arabic</option><option>Mandarin Chinese</option></select></label>
        </div>
        <p class="workspace-translator-status" id="workspace-translator-status" role="status" aria-live="polite" hidden></p>
      </div>
      <footer class="workspace-translator-footer"><button class="workspace-translator-submit" type="submit">Translate <i data-lucide="arrow-right" aria-hidden="true"></i></button></footer>
    </form>`;
  document.body.append(dialog);

  if (window.lucide) window.lucide.createIcons();

  const closeButton = dialog.querySelector(".workspace-translator-close");
  const form = dialog.querySelector("#workspace-translator-form");
  const source = dialog.querySelector("#workspace-translator-source");
  const result = dialog.querySelector("#workspace-translator-result");
  const from = dialog.querySelector("#workspace-translator-from");
  const to = dialog.querySelector("#workspace-translator-to");
  const swap = dialog.querySelector(".workspace-translator-swap");
  const status = dialog.querySelector("#workspace-translator-status");

  appsMenu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (item?.textContent.trim().toLowerCase() !== "language translator") return;
    event.preventDefault();
    dialog.showModal();
    source.focus();
    const dropdown = document.querySelector(".intelligent-apps-dropdown");
    dropdown?.setAttribute("data-open", "false");
    dropdown?.querySelector(".top-pill")?.setAttribute("aria-expanded", "false");
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  swap.addEventListener("click", () => {
    const previousFrom = from.value;
    from.value = to.value;
    to.value = previousFrom;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!source.value.trim()) {
      source.focus();
      return;
    }
    result.textContent = "Translation service is not connected yet.";
    result.classList.add("is-unavailable");
    status.textContent = `Set up a translation service to translate ${from.value} to ${to.value}.`;
    status.hidden = false;
  });
})();
