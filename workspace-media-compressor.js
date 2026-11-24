(() => {
  const menu = document.querySelector(".intelligent-apps-menu");
  if (!menu) return;

  const dialog = document.createElement("dialog");
  dialog.className = "workspace-media-dialog intelligent-app-dialog";
  dialog.setAttribute("aria-labelledby", "workspace-media-title");
  dialog.innerHTML = `
    <section class="workspace-media-window">
      <header class="workspace-media-header intelligent-app-header">
        <span class="workspace-media-mark"><i data-lucide="images" aria-hidden="true"></i></span>
        <div><p>INTELLIGENT APPS</p><h2 id="workspace-media-title">Media Compressor</h2><small>Make image files smaller while keeping them clear.</small></div>
        <button class="workspace-media-close intelligent-app-close" type="button" aria-label="Close Media Compressor"><i data-lucide="x" aria-hidden="true"></i></button>
      </header>
      <div class="workspace-media-body">
        <label class="workspace-media-drop" for="workspace-media-file" tabindex="0">
          <input id="workspace-media-file" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png,application/pdf,.pdf">
          <span class="workspace-media-upload-icon"><i data-lucide="upload-cloud" aria-hidden="true"></i></span>
          <strong class="workspace-media-drop-title">Choose a file or drag it here</strong>
          <small>Images (JPG, PNG) or PDF files</small>
        </label>
        <section class="workspace-media-details" hidden>
          <span class="workspace-media-file-icon"><i data-lucide="file-image" aria-hidden="true"></i></span>
          <div><strong class="workspace-media-name"></strong><small class="workspace-media-size"></small></div>
          <button class="workspace-media-remove" type="button" aria-label="Remove selected file"><i data-lucide="x" aria-hidden="true"></i></button>
        </section>
        <section class="workspace-media-quality" hidden>
          <div><strong>Compression quality</strong><span class="workspace-media-quality-value">80%</span></div>
          <input type="range" min="35" max="95" value="80" aria-label="Image compression quality">
          <small>Lower quality creates a smaller file.</small>
        </section>
        <p class="workspace-media-status" role="status" aria-live="polite" hidden></p>
      </div>
      <footer class="workspace-media-footer">
        <button class="workspace-media-cancel" type="button">Cancel</button>
        <button class="workspace-media-compress intelligent-app-primary" type="button" disabled><i data-lucide="minimize-2" aria-hidden="true"></i><span>Compress Media</span></button>
      </footer>
    </section>`;
  document.body.append(dialog);
  if (window.lucide) window.lucide.createIcons();

  const input = dialog.querySelector("input[type=file]");
  const drop = dialog.querySelector(".workspace-media-drop");
  const details = dialog.querySelector(".workspace-media-details");
  const quality = dialog.querySelector(".workspace-media-quality");
  const qualityInput = quality.querySelector("input");
  const qualityValue = dialog.querySelector(".workspace-media-quality-value");
  const status = dialog.querySelector(".workspace-media-status");
  const compress = dialog.querySelector(".workspace-media-compress");
  let selectedFile = null;
  let imageUrl = "";

  const readableSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  function showStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle("is-error", error);
    status.hidden = !message;
  }

  function clearSelection() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = "";
    selectedFile = null;
    input.value = "";
    details.hidden = true;
    quality.hidden = true;
    dialog.classList.remove("has-file");
    compress.disabled = true;
    dialog.querySelector(".workspace-media-drop-title").textContent = "Choose a file or drag it here";
    showStatus("");
  }

  function chooseFile(file) {
    if (!file) return;
    const isImage = ["image/jpeg", "image/png"].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      showStatus("Choose a JPG, PNG, or PDF file.", true);
      return;
    }
    clearSelection();
    selectedFile = file;
    dialog.classList.add("has-file");
    details.hidden = false;
    dialog.querySelector(".workspace-media-name").textContent = file.name;
    dialog.querySelector(".workspace-media-size").textContent = `${readableSize(file.size)} · ${isImage ? "Image" : "PDF"}`;
    dialog.querySelector(".workspace-media-drop-title").textContent = file.name;
    if (isImage) {
      quality.hidden = false;
      compress.disabled = false;
      showStatus("");
    } else {
      compress.disabled = true;
      showStatus("PDF compression needs a server connection that is not configured here.");
    }
  }

  function compressImage(file, amount) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        const maxEdge = 2400;
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("This image could not be compressed.")), "image/jpeg", amount / 100);
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be opened.")); };
      image.src = url;
    });
  }

  menu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (item?.textContent.trim().toLowerCase() !== "media compressor") return;
    event.preventDefault();
    dialog.showModal();
    const dropdown = document.querySelector(".intelligent-apps-dropdown");
    dropdown?.setAttribute("data-open", "false");
    dropdown?.querySelector(".top-pill")?.setAttribute("aria-expanded", "false");
  });

  dialog.querySelector(".workspace-media-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".workspace-media-cancel").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", clearSelection);
  dialog.querySelector(".workspace-media-remove").addEventListener("click", clearSelection);
  input.addEventListener("change", () => chooseFile(input.files?.[0]));
  qualityInput.addEventListener("input", () => { qualityValue.textContent = `${qualityInput.value}%`; });
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); input.click(); }
  });
  ["dragenter", "dragover"].forEach((type) => drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((type) => drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
  }));
  drop.addEventListener("drop", (event) => chooseFile(event.dataTransfer?.files?.[0]));

  compress.addEventListener("click", async () => {
    if (!selectedFile || compress.disabled) return;
    compress.disabled = true;
    compress.querySelector("span").textContent = "Compressing…";
    showStatus("Optimizing your image…");
    try {
      const blob = await compressImage(selectedFile, Number(qualityInput.value));
      const originalName = selectedFile.name.replace(/\.[^.]+$/, "") || "image";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${originalName}-compressed.jpg`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      const change = Math.round((1 - blob.size / selectedFile.size) * 100);
      showStatus(`Compressed image downloaded · ${readableSize(blob.size)}${change > 0 ? ` · ${change}% smaller` : ""}`);
    } catch (error) {
      showStatus(error.message || "The image could not be compressed.", true);
    } finally {
      compress.disabled = false;
      compress.querySelector("span").textContent = "Compress Media";
    }
  });
})();
