(() => {
  const appsMenu = document.querySelector(".intelligent-apps-menu");
  if (!appsMenu) return;

  const dialog = document.createElement("dialog");
  dialog.className = "workspace-tts-dialog";
  dialog.setAttribute("aria-labelledby", "workspace-tts-title");
  dialog.innerHTML = `
    <form class="workspace-tts-window" id="workspace-tts-form">
      <header class="workspace-tts-header">
        <span class="workspace-tts-mark"><i data-lucide="audio-lines" aria-hidden="true"></i></span>
        <div><p>INTELLIGENT APPS</p><h2 id="workspace-tts-title">Text to Speech</h2><small>Convert your text into natural sounding speech.</small></div>
        <button class="workspace-tts-close" type="button" aria-label="Close Text to Speech"><i data-lucide="x" aria-hidden="true"></i></button>
      </header>
      <div class="workspace-tts-body">
        <label for="workspace-tts-text">Text to read</label>
        <textarea id="workspace-tts-text" placeholder="Enter text or news here..." rows="5"></textarea>
        <p class="workspace-tts-status" id="workspace-tts-status" role="status" aria-live="polite" hidden></p>
      </div>
      <footer class="workspace-tts-footer">
        <button class="workspace-tts-listen" type="submit"><i data-lucide="play" aria-hidden="true"></i><span>Listen</span></button>
        <button class="workspace-tts-stop" type="button"><i data-lucide="square" aria-hidden="true"></i><span>Stop</span></button>
      </footer>
    </form>`;
  document.body.append(dialog);

  if (window.lucide) window.lucide.createIcons();

  const form = dialog.querySelector("#workspace-tts-form");
  const textInput = dialog.querySelector("#workspace-tts-text");
  const status = dialog.querySelector("#workspace-tts-status");
  const stopButton = dialog.querySelector(".workspace-tts-stop");
  const closeButton = dialog.querySelector(".workspace-tts-close");
  const listenButton = dialog.querySelector(".workspace-tts-listen");

  function stopSpeech() {
    window.speechSynthesis?.cancel();
    listenButton.classList.remove("is-speaking");
    status.hidden = true;
  }

  appsMenu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (item?.textContent.trim().toLowerCase() !== "text-to-speech") return;
    event.preventDefault();
    dialog.showModal();
    textInput.focus();
    const dropdown = document.querySelector(".intelligent-apps-dropdown");
    dropdown?.setAttribute("data-open", "false");
    dropdown?.querySelector(".top-pill")?.setAttribute("aria-expanded", "false");
  });

  closeButton.addEventListener("click", () => {
    stopSpeech();
    dialog.close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      stopSpeech();
      dialog.close();
    }
  });
  dialog.addEventListener("close", stopSpeech);
  stopButton.addEventListener("click", stopSpeech);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = textInput.value.trim();
    if (!text) {
      status.textContent = "Enter some text to listen to.";
      status.hidden = false;
      textInput.focus();
      return;
    }
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      status.textContent = "Speech playback is not supported in this browser.";
      status.hidden = false;
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      listenButton.classList.add("is-speaking");
      status.textContent = "Reading your text aloud…";
      status.hidden = false;
    };
    utterance.onend = () => {
      listenButton.classList.remove("is-speaking");
      status.hidden = true;
    };
    utterance.onerror = () => {
      listenButton.classList.remove("is-speaking");
      status.textContent = "Speech playback could not be started.";
      status.hidden = false;
    };
    window.speechSynthesis.speak(utterance);
  });
})();
