(() => {
  const calendar = document.getElementById("school-calendar");
  if (!calendar) return;

  const today = document.getElementById("welcome-date").dateTime;
  const openButton = document.getElementById("view-school-calendar");
  const addButton = document.getElementById("calendar-add");
  const editor = document.getElementById("calendar-editor");
  const editorTitle = document.getElementById("calendar-editor-title");
  const titleInput = editor.elements.namedItem("title");
  const dateInput = editor.elements.namedItem("date");
  const notesInput = editor.elements.namedItem("notes");
  const days = document.getElementById("calendar-days");
  const agenda = document.getElementById("calendar-events");
  const upcoming = document.querySelector(".important-dates-list");
  const status = document.getElementById("calendar-status");
  const storageKey = "vaps-school-calendar";
  const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const isoDate = (date) => date.toISOString().slice(0, 10);
  const dateLabel = (date) => dayFormat.format(new Date(date));

  const sampleEvents = ["Parent–teacher meeting", "Fee payment deadline", "Term assessment begins"]
    .map((title, index) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + (index + 1) * 7);
      return { id: `sample-${index}`, title, date: isoDate(date), notes: "", sample: true };
    });

  function saveEvents() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(events));
      return true;
    } catch {
      return false;
    }
  }

  let events = sampleEvents;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(stored)) events = stored;
  } catch {}
  if (events === sampleEvents) saveEvents();

  let month;
  let editingId;
  let editorTrigger;
  const sorted = () => [...events].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  function element(tag, text, className) {
    const item = document.createElement(tag);
    if (text) item.textContent = text;
    if (className) item.className = className;
    return item;
  }

  function renderUpcoming() {
    const next = sorted().filter(({ date }) => date >= today).slice(0, 3);
    upcoming.replaceChildren(...next.map((event) => {
      const item = element("li");
      const date = element("time", dateLabel(event.date));
      date.dateTime = event.date;
      const label = element("span", event.title);
      if (event.sample) label.append(element("small", "Sample", "school-calendar-sample"));
      item.append(date, label);
      return item;
    }));
    if (!next.length) upcoming.append(element("li", "No upcoming events.", "important-dates-empty"));
  }

  function showEditor(date, event, trigger) {
    editingId = event?.id;
    editorTrigger = trigger;
    editorTitle.textContent = event ? "Edit event" : "Add event";
    titleInput.value = event?.title ?? "";
    dateInput.value = date;
    notesInput.value = event?.notes ?? "";
    titleInput.setCustomValidity("");
    editor.hidden = false;
    titleInput.focus();
  }

  function closeEditor(restoreFocus = false) {
    editor.hidden = true;
    editingId = undefined;
    if (restoreFocus) editorTrigger?.focus();
  }

  function announce(message) {
    status.textContent = saveEvents() ? message : `${message} Browser storage is unavailable. Changes last until this page is closed.`;
  }

  function renderAgenda(monthEvents) {
    agenda.replaceChildren(...monthEvents.map((event) => {
      const item = element("li");
      const details = element("div", "", "school-calendar-event-copy");
      const time = element("time", dateLabel(event.date));
      time.dateTime = event.date;
      details.append(time, element("strong", event.title));
      if (event.sample) details.append(element("small", "Sample event", "school-calendar-sample"));
      if (event.notes) details.append(element("p", event.notes));

      const actions = element("div", "", "school-calendar-event-actions");
      const edit = element("button", "Edit");
      const remove = element("button", "Remove");
      edit.type = remove.type = "button";
      edit.setAttribute("aria-label", `Edit ${event.title}`);
      remove.setAttribute("aria-label", `Remove ${event.title}`);
      edit.addEventListener("click", () => showEditor(event.date, event, edit));
      remove.addEventListener("click", () => {
        if (!window.confirm(`Remove “${event.title}” from the calendar?`)) return;
        if (editingId === event.id) closeEditor();
        events = events.filter(({ id }) => id !== event.id);
        render();
        announce("Event removed.");
        addButton.focus();
      });
      actions.append(edit, remove);
      item.append(details, actions);
      return item;
    }));
    if (!monthEvents.length) agenda.append(element("li", "No events this month.", "school-calendar-empty"));
  }

  function render() {
    const monthKey = isoDate(month).slice(0, 7);
    const monthEvents = sorted().filter(({ date }) => date.startsWith(monthKey));
    document.getElementById("calendar-month").textContent = monthFormat.format(month);

    const year = month.getUTCFullYear();
    const monthIndex = month.getUTCMonth();
    const firstColumn = (month.getUTCDay() + 6) % 7;
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const rows = document.createDocumentFragment();
    for (let offset = 0; offset < firstColumn + lastDay; offset += 7) {
      const row = rows.appendChild(element("tr"));
      for (let column = 0; column < 7; column++) {
        const cell = row.insertCell();
        const day = offset + column - firstColumn + 1;
        if (day < 1 || day > lastDay) continue;
        const date = `${monthKey}-${String(day).padStart(2, "0")}`;
        const count = monthEvents.filter((event) => event.date === date).length;
        const button = element("button", day);
        button.type = "button";
        button.setAttribute("aria-label", `Add event on ${dateLabel(date)}${count ? `, ${count} scheduled` : ""}`);
        button.classList.toggle("has-event", count > 0);
        if (date === today) button.setAttribute("aria-current", "date");
        button.addEventListener("click", () => showEditor(date, undefined, button));
        cell.append(button);
      }
    }
    days.replaceChildren(rows);
    renderAgenda(monthEvents);
    renderUpcoming();
  }

  function showMonth(date) {
    month = new Date(`${date.slice(0, 7)}-01`);
    render();
  }

  openButton.addEventListener("click", () => {
    status.textContent = "";
    closeEditor();
    showMonth(sorted().find(({ date }) => date >= today)?.date ?? today);
    calendar.showModal();
  });

  document.getElementById("calendar-today").addEventListener("click", () => showMonth(today));
  for (const [id, step] of [["calendar-previous", -1], ["calendar-next", 1]]) {
    document.getElementById(id).addEventListener("click", () => {
      month.setUTCMonth(month.getUTCMonth() + step);
      render();
    });
  }

  addButton.addEventListener("click", () => {
    const first = isoDate(month);
    showEditor(today.startsWith(first.slice(0, 7)) ? today : first, undefined, addButton);
  });
  document.getElementById("calendar-cancel").addEventListener("click", () => closeEditor(true));
  titleInput.addEventListener("input", () => titleInput.setCustomValidity(""));
  editor.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity("Enter an event name.");
      titleInput.reportValidity();
      return;
    }
    const edited = Boolean(editingId);
    const event = {
      id: editingId ?? crypto.randomUUID(),
      title,
      date: dateInput.value,
      notes: notesInput.value.trim(),
      sample: false
    };
    events = edited ? events.map((item) => item.id === event.id ? event : item) : [...events, event];
    closeEditor();
    showMonth(event.date);
    announce(edited ? "Event updated." : "Event added.");
    addButton.focus();
  });
  renderUpcoming();
})();
