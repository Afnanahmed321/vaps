(() => {
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  });
  const formatMoney = (value) => currency.format(value);
  const dateLabel = (date) => new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", timeZone: "UTC"
  }).format(new Date(date));
  const daysBefore = (date, days) => new Date(Date.parse(date) - days * 86400000).toISOString().slice(0, 10);

  function renderBars(container, points, format, maximum = Math.max(1, ...points.map(({ value }) => value))) {
    const bars = points.map(({ label, value }) => {
      const bar = document.createElement("li");
      const track = document.createElement("span");
      track.className = "operations-bar";
      track.style.setProperty("--bar-height", `${100 * value / maximum}%`);
      track.classList.toggle("is-low", maximum === 100 && value < 85);
      track.setAttribute("aria-hidden", "true");
      const caption = document.createElement("span");
      caption.className = "operations-bar-label";
      caption.textContent = label;
      const amount = document.createElement("span");
      amount.className = "operations-bar-value";
      amount.textContent = format(value);
      bar.append(amount, track, caption);
      return bar;
    });
    container.style.setProperty("--bar-count", String(points.length));
    container.replaceChildren(...bars);
  }

  function openMessageDraft(title, message, onOpen = () => {}) {
    const dialog = document.createElement("dialog");
    dialog.className = "operations-dialog";
    dialog.setAttribute("aria-label", title);
    // The template is static. User and record values are assigned as text below.
    dialog.innerHTML = `<form>
      <h2></h2>
      <label>Parent mobile number <input name="mobile" type="tel" autocomplete="tel" required placeholder="+91 …"></label>
      <label>Message <textarea name="message" rows="4" required></textarea></label>
      <p>Review the recipient and message in your messaging app before sending.</p>
      <div class="operations-actions">
        <button class="operations-button" type="submit" value="WhatsApp">Open WhatsApp</button>
        <button class="operations-button" type="submit" value="SMS">Open SMS</button>
        <button class="operations-button secondary" type="button">Cancel</button>
      </div>
    </form>`;
    const form = dialog.querySelector("form");
    dialog.querySelector("h2").textContent = title;
    const mobile = form.elements.namedItem("mobile");
    const draft = form.elements.namedItem("message");
    draft.value = message;
    mobile.addEventListener("input", () => mobile.setCustomValidity(""));
    dialog.querySelector('[type="button"]').addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const number = mobile.value.replace(/[\s().-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(number) || !draft.value.trim()) {
        if (!/^\+[1-9]\d{7,14}$/.test(number)) {
          mobile.setCustomValidity("Enter the full number with country code.");
          mobile.reportValidity();
        } else {
          draft.focus();
        }
        return;
      }
      const text = encodeURIComponent(draft.value.trim());
      const channel = event.submitter?.value || "WhatsApp";
      if (channel === "SMS") {
        const separator = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "&" : "?";
        window.location.href = `sms:+${number.replace(/^\+/, "")}${separator}body=${text}`;
      } else {
        window.open(`https://wa.me/${number.replace(/^\+/, "")}?text=${text}`, "_blank", "noopener,noreferrer");
      }
      onOpen(channel);
      dialog.close();
    });
    document.body.append(dialog);
    dialog.showModal();
  }

  window.WorkspaceOperations = { renderBars, formatMoney, dateLabel, daysBefore, openMessageDraft };
})();
