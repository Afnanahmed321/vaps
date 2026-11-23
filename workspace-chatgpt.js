(() => {
  const appsMenu = document.querySelector(".intelligent-apps-menu");
  if (!appsMenu) return;

  const dialog = document.createElement("dialog");
  dialog.className = "workspace-chatgpt-dialog";
  dialog.setAttribute("aria-labelledby", "workspace-chatgpt-title");
  dialog.innerHTML = `
    <section class="workspace-chatgpt-window">
      <header class="workspace-chatgpt-header">
        <span class="workspace-chatgpt-mark"><i data-lucide="sparkles" aria-hidden="true"></i></span>
        <div><p>INTELLIGENT APPS</p><h2 id="workspace-chatgpt-title">AIVRM ChatGPT</h2><small>Ask a question and explore an idea.</small></div>
        <button class="workspace-chatgpt-close" type="button" aria-label="Close ChatGPT"><i data-lucide="x" aria-hidden="true"></i></button>
      </header>
      <div class="workspace-chatgpt-messages" id="workspace-chatgpt-messages" aria-live="polite">
        <article class="workspace-chatgpt-message assistant"><span class="workspace-chatgpt-message-icon"><i data-lucide="sparkles" aria-hidden="true"></i></span><p>Hi, welcome to ChatGPT! You can ask anything.</p></article>
      </div>
      <form class="workspace-chatgpt-composer" id="workspace-chatgpt-form">
        <label class="workspace-chatgpt-input-wrap" for="workspace-chatgpt-input"><span class="sr-only">Message ChatGPT</span><textarea id="workspace-chatgpt-input" rows="2" placeholder="Message ChatGPT..."></textarea></label>
        <button class="workspace-chatgpt-send" type="submit" aria-label="Send message"><i data-lucide="arrow-up" aria-hidden="true"></i></button>
        <p class="workspace-chatgpt-status" id="workspace-chatgpt-status">ChatGPT can make mistakes. Check important information.</p>
      </form>
    </section>`;
  document.body.append(dialog);

  if (window.lucide) window.lucide.createIcons();

  const closeButton = dialog.querySelector(".workspace-chatgpt-close");
  const form = dialog.querySelector("#workspace-chatgpt-form");
  const input = dialog.querySelector("#workspace-chatgpt-input");
  const messages = dialog.querySelector("#workspace-chatgpt-messages");
  const status = dialog.querySelector("#workspace-chatgpt-status");

  appsMenu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (item?.textContent.trim().toLowerCase() !== "chatgpt") return;
    event.preventDefault();
    dialog.showModal();
    input.focus();
    const dropdown = document.querySelector(".intelligent-apps-dropdown");
    dropdown?.setAttribute("data-open", "false");
    dropdown?.querySelector(".top-pill")?.setAttribute("aria-expanded", "false");
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  function addMessage(text, role) {
    const message = document.createElement("article");
    message.className = `workspace-chatgpt-message ${role}`;
    const bubble = document.createElement("p");
    bubble.textContent = text;
    if (role === "assistant") {
      const iconWrap = document.createElement("span");
      iconWrap.className = "workspace-chatgpt-message-icon";
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", "sparkles");
      iconWrap.append(icon);
      message.append(iconWrap, bubble);
    } else {
      message.append(bubble);
    }
    messages.append(message);
    if (window.lucide) window.lucide.createIcons();
    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";
    status.textContent = "ChatGPT connection is not configured yet.";
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
})();
