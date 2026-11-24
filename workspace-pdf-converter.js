(() => {
  const appsMenu = document.querySelector(".intelligent-apps-menu");
  if (!appsMenu) return;

  const dialog = document.createElement("dialog");
  dialog.className = "workspace-pdf-dialog intelligent-app-dialog";
  dialog.setAttribute("aria-labelledby", "workspace-pdf-title");
  dialog.innerHTML = `
    <section class="workspace-pdf-window">
      <header class="workspace-pdf-header intelligent-app-header">
        <span class="workspace-pdf-mark"><i data-lucide="file-text" aria-hidden="true"></i></span>
        <div><p>INTELLIGENT APPS</p><h2 id="workspace-pdf-title">PDF Converter</h2><small>Turn an image or text file into a PDF.</small></div>
        <button class="workspace-pdf-close intelligent-app-close" type="button" aria-label="Close PDF Converter"><i data-lucide="x" aria-hidden="true"></i></button>
      </header>
      <div class="workspace-pdf-body">
        <label class="workspace-pdf-drop" for="workspace-pdf-file" tabindex="0">
          <input id="workspace-pdf-file" type="file" accept=".jpg,.jpeg,.jfif,.png,.txt,image/jpeg,image/png,text/plain" />
          <span class="workspace-pdf-upload-icon"><i data-lucide="upload-cloud" aria-hidden="true"></i></span>
          <strong class="workspace-pdf-drop-title">Choose a file or drag it here</strong>
          <small>JPG, JFIF, JPEG, PNG, or TXT</small>
        </label>
        <section class="workspace-pdf-preview" aria-label="Selected file preview">
          <div class="workspace-pdf-preview-visual"><i data-lucide="eye" aria-hidden="true"></i><img alt="Selected image preview" hidden><p hidden></p></div>
          <div class="workspace-pdf-file-copy"><strong>No file selected</strong><small>Select a supported file to continue.</small></div>
          <button class="workspace-pdf-remove" type="button" aria-label="Remove selected file" hidden><i data-lucide="x" aria-hidden="true"></i></button>
        </section>
        <p class="workspace-pdf-status" role="status" aria-live="polite" hidden></p>
      </div>
      <footer class="workspace-pdf-footer">
        <span>Files are converted in your browser.</span>
        <button class="workspace-pdf-convert intelligent-app-primary" type="button" disabled><i data-lucide="file-down" aria-hidden="true"></i><span>Convert to PDF</span></button>
      </footer>
    </section>`;
  document.body.append(dialog);
  if (window.lucide) window.lucide.createIcons();

  const input = dialog.querySelector("#workspace-pdf-file");
  const drop = dialog.querySelector(".workspace-pdf-drop");
  const title = dialog.querySelector(".workspace-pdf-drop-title");
  const preview = dialog.querySelector(".workspace-pdf-preview");
  const previewImage = preview.querySelector("img");
  const previewText = preview.querySelector("p");
  const previewIcon = preview.querySelector(".workspace-pdf-preview-visual > svg");
  const fileName = preview.querySelector(".workspace-pdf-file-copy strong");
  const fileInfo = preview.querySelector(".workspace-pdf-file-copy small");
  const removeButton = dialog.querySelector(".workspace-pdf-remove");
  const convertButton = dialog.querySelector(".workspace-pdf-convert");
  const status = dialog.querySelector(".workspace-pdf-status");
  let selectedFile = null;
  let previewUrl = "";

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
    status.hidden = !message;
  }

  function clearSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    selectedFile = null;
    dialog.classList.remove("has-file");
    input.value = "";
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    previewText.hidden = true;
    previewText.textContent = "";
    previewIcon.hidden = false;
    preview.classList.remove("has-file");
    fileName.textContent = "No file selected";
    fileInfo.textContent = "Select a supported file to continue.";
    title.textContent = "Choose a file or drag it here";
    removeButton.hidden = true;
    convertButton.disabled = true;
    showStatus("");
  }

  async function selectFile(file) {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "jfif", "png", "txt"].includes(extension)) {
      showStatus("Choose a JPG, JFIF, JPEG, PNG, or TXT file.", true);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedFile = file;
    dialog.classList.add("has-file");
    preview.classList.add("has-file");
    previewIcon.hidden = true;
    previewImage.hidden = true;
    previewText.hidden = true;
    fileName.textContent = file.name;
    fileInfo.textContent = `${(file.size / 1024).toFixed(0)} KB · Ready to convert`;
    title.textContent = file.name;
    removeButton.hidden = false;
    convertButton.disabled = false;
    showStatus("");

    if (extension === "txt") {
      previewText.textContent = (await file.text()).slice(0, 180) || "This text file is empty.";
      previewText.hidden = false;
    } else {
      previewUrl = URL.createObjectURL(file);
      previewImage.src = previewUrl;
      previewImage.hidden = false;
    }
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The image could not be opened.")); };
      image.src = url;
    });
  }

  function canvasJpegBytes(canvas) {
    const encoded = canvas.toDataURL("image/jpeg", .92).split(",")[1];
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function makeCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1190;
    canvas.height = 1684;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    return { canvas, context };
  }

  async function imagePages(file) {
    const image = await loadImage(file);
    const { canvas, context } = makeCanvas();
    const margin = 65;
    const scale = Math.min((canvas.width - margin * 2) / image.width, (canvas.height - margin * 2) / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return [canvasJpegBytes(canvas)];
  }

  async function textPages(file) {
    const text = await file.text();
    const measureCanvas = document.createElement("canvas");
    const measure = measureCanvas.getContext("2d");
    measure.font = "14px Arial";
    const margin = 48;
    const maxWidth = 595 - margin * 2;
    const lines = [];
    text.split(/\r?\n/).forEach((paragraph) => {
      if (!paragraph) { lines.push(""); return; }
      let line = "";
      paragraph.split(/\s+/).forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (line && measure.measureText(next).width > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      lines.push(line);
    });
    if (!lines.length) lines.push("");

    const linesPerPage = 36;
    const pages = [];
    for (let offset = 0; offset < lines.length; offset += linesPerPage) {
      const { canvas, context } = makeCanvas();
      context.scale(2, 2);
      context.fillStyle = "#17234b";
      context.font = "14px Arial";
      context.textBaseline = "top";
      lines.slice(offset, offset + linesPerPage).forEach((line, index) => context.fillText(line, margin, margin + index * 20));
      pages.push(canvasJpegBytes(canvas));
    }
    return pages;
  }

  function makePdf(jpegPages) {
    const encoder = new TextEncoder();
    const objects = [];
    objects.push(encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"));
    const pageRefs = jpegPages.map((_, index) => `${3 + index * 3} 0 R`).join(" ");
    objects.push(encoder.encode(`<< /Type /Pages /Kids [${pageRefs}] /Count ${jpegPages.length} >>`));

    jpegPages.forEach((jpeg, index) => {
      const pageObject = 3 + index * 3;
      const contentObject = pageObject + 1;
      const imageObject = pageObject + 2;
      objects.push(encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`));
      const content = encoder.encode("q 595 0 0 842 0 0 cm /Im0 Do Q");
      objects.push(encoder.encode(`<< /Length ${content.length} >>\nstream\nq 595 0 0 842 0 0 cm /Im0 Do Q\nendstream`));
      objects.push({ image: jpeg, header: encoder.encode(`<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), footer: encoder.encode("\nendstream") });
    });

    const chunks = [encoder.encode("%PDF-1.4\n")];
    const offsets = [0];
    let byteLength = chunks[0].length;
    objects.forEach((object, index) => {
      offsets.push(byteLength);
      const start = encoder.encode(`${index + 1} 0 obj\n`);
      let body = object;
      if (!(object instanceof Uint8Array)) {
        body = new Uint8Array(object.header.length + object.image.length + object.footer.length);
        body.set(object.header, 0);
        body.set(object.image, object.header.length);
        body.set(object.footer, object.header.length + object.image.length);
      }
      const end = encoder.encode("\nendobj\n");
      chunks.push(start, body, end);
      byteLength += start.length + body.length + end.length;
    });
    const xrefOffset = byteLength;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { xref += `${String(offset).padStart(10,"0")} 00000 n \n`; });
    const trailer = encoder.encode(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    chunks.push(trailer);
    return new Blob(chunks, { type: "application/pdf" });
  }

  function closeDialog() {
    clearSelection();
  }

  appsMenu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (item?.textContent.trim().toLowerCase() !== "pdf converter") return;
    event.preventDefault();
    dialog.showModal();
    const dropdown = document.querySelector(".intelligent-apps-dropdown");
    dropdown?.setAttribute("data-open", "false");
    dropdown?.querySelector(".top-pill")?.setAttribute("aria-expanded", "false");
  });

  dialog.querySelector(".workspace-pdf-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", closeDialog);
  removeButton.addEventListener("click", clearSelection);
  input.addEventListener("change", () => selectFile(input.files?.[0]));

  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });
  ["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => {
    event.preventDefault();
    drop.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
  }));
  drop.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) selectFile(file);
  });

  convertButton.addEventListener("click", async () => {
    if (!selectedFile) return;
    convertButton.disabled = true;
    convertButton.querySelector("span").textContent = "Converting…";
    showStatus("Preparing your PDF…");
    try {
      const extension = selectedFile.name.split(".").pop().toLowerCase();
      const pages = extension === "txt" ? await textPages(selectedFile) : await imagePages(selectedFile);
      const pdf = makePdf(pages);
      const url = URL.createObjectURL(pdf);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedFile.name.replace(/\.[^.]+$/, "") || "converted"}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showStatus("Your PDF has been downloaded.");
    } catch (error) {
      showStatus(error.message || "This file could not be converted.", true);
    } finally {
      convertButton.disabled = false;
      convertButton.querySelector("span").textContent = "Convert to PDF";
    }
  });
})();
