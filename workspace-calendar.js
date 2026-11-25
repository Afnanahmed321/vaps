(() => {
  const calendar = document.getElementById("school-calendar");
  if (!calendar) return;

  const today = document.getElementById("welcome-date").dateTime;
  const openButton = document.getElementById("view-school-calendar");
  const addButton = document.getElementById("calendar-add");
  const importInput = document.getElementById("calendar-import");
  const importTrigger = document.getElementById("calendar-import-trigger");
  const eventTypes = { holiday: "Holiday", exam: "Exam", ptm: "Parent–teacher meeting", "fee-due": "Fee due" };
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
    const next = sorted().filter(({ date }) => date >= today).slice(0, 5);
    upcoming.replaceChildren(...next.map((event) => {
      const item = element("li");
      const date = element("time", dateLabel(event.date));
      date.dateTime = event.date;
      const label = element("span", event.title);
      if (event.sample || event.type) label.append(element("small", event.sample ? "Demo" : eventTypes[event.type], "school-calendar-sample"));
      item.append(date, label);
      if (!event.sample) item.append(announcementButton(event));
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
    editor.scrollIntoView({ block: "nearest" });
  }

  function closeEditor(restoreFocus = false) {
    editor.hidden = true;
    editingId = undefined;
    if (restoreFocus) (editorTrigger?.isConnected ? editorTrigger : addButton).focus();
  }

  function announce(message, event) {
    status.textContent = saveEvents() ? message : `${message} Browser storage is unavailable. Changes last until this page is closed.`;
    window.dispatchEvent(new CustomEvent("vaps:calendar-change", {
      detail: { title: event.title, action: message.replace(/\.$/, "") }
    }));
  }

  function announcementButton(event) {
    const button = element("button", "Announce", "calendar-announce");
    button.type = "button";
    button.setAttribute("aria-label", `Announce ${event.title} to a parent`);
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => {
      const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(new Date(event.date));
      window.WorkspaceOperations.openMessageDraft("Event announcement",
        `Dear Parent, please note that ${event.title} is scheduled for ${date}. — Tunbridge High School`);
    });
    return button;
  }

  function addSchedule(records) {
    if (!Array.isArray(records) || !records.length) throw new Error();
    const imported = records.map((record) => {
      if (!record || !Object.hasOwn(eventTypes, record.type) ||
          typeof record.title !== "string" || !record.title.trim() || record.title.length > 120 ||
          typeof record.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) ||
          !Number.isFinite(Date.parse(record.date)) || isoDate(new Date(record.date)) !== record.date ||
          (record.notes != null && (typeof record.notes !== "string" || record.notes.length > 500))) throw new Error();
      return { title: record.title.trim(), date: record.date, type: record.type, notes: record.notes?.trim() ?? "", sample: false };
    });
    const eventKey = ({ date, title }) => `${date}|${title.toLocaleLowerCase()}`;
    const existingKeys = new Set(events.filter((event) => !event.sample).map(eventKey));
    const additions = imported.filter((event) => {
      const key = eventKey(event);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    if (!additions.length) return additions;
    const addedKeys = new Set(additions.map(eventKey));
    events = [
      ...events.filter((event) => !event.sample || !addedKeys.has(eventKey(event))),
      ...additions.map((event) => ({ ...event, id: `schedule-${eventKey(event)}` }))
    ];
    return additions;
  }

  importTrigger?.addEventListener("click", () => importInput.click());
  importInput?.addEventListener("change", async () => {
    const file = importInput.files[0];
    importInput.value = "";
    if (!file) return;

    try {
      if (file.size > 1000000) throw new Error("Choose a JSON schedule smaller than 1 MB.");
      const additions = addSchedule(JSON.parse(await file.text()));
      if (!additions.length) {
        status.textContent = "These events are already on the calendar.";
        return;
      }
      const dates = additions.map(({ date }) => date).sort();
      showMonth(dates.find((date) => date >= today) ?? dates[0]);
      const saved = saveEvents();
      status.textContent = `${additions.length} schedule ${additions.length === 1 ? "event added" : "events added"}.${saved ? "" : " Browser storage is unavailable."}`;
      window.dispatchEvent(new CustomEvent("vaps:calendar-change", {
        detail: { title: "School schedule", action: "Schedule imported" }
      }));
    } catch (error) {
      status.textContent = error.message.startsWith("Choose") ? error.message
        : 'Use a JSON list such as [{"type":"holiday","title":"School holiday","date":"2027-01-15"}]. Accepted types are holiday, exam, ptm, and fee-due.';
    }
  });

  async function syncSchoolSchedule() {
    if (!calendar.dataset.scheduleUrl) return;
    try {
      const url = new URL(calendar.dataset.scheduleUrl, document.baseURI);
      if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) throw new Error();
      const response = await fetch(url, { redirect: "error" });
      if (!response.ok) throw new Error();
      if (!addSchedule(await response.json()).length) return;
      saveEvents();
      if (calendar.open) render();
      else renderUpcoming();
    } catch {
      status.textContent = "School schedule could not be loaded.";
    }
  }

  function renderAgenda(monthEvents) {
    agenda.replaceChildren(...monthEvents.map((event) => {
      const item = element("li");
      const details = element("div", "", "school-calendar-event-copy");
      const time = element("time", dateLabel(event.date));
      time.dateTime = event.date;
      details.append(time, element("strong", event.title));
      if (event.sample || event.type) details.append(element("small", event.sample ? "Demo event" : eventTypes[event.type], "school-calendar-sample"));
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
        announce("Event removed.", event);
        addButton.focus();
      });
      if (!event.sample) actions.append(announcementButton(event));
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

  function openCalendar(date) {
    status.textContent = "";
    closeEditor();
    showMonth(date);
    calendar.showModal();
  }

  function openUpcomingCalendar() {
    openCalendar(sorted().find(({ date }) => date >= today)?.date ?? today);
  }

  window.addEventListener("vaps:calendar-open-event", ({ detail }) => {
    if (events.some(({ date, title }) => date === detail.date && title === detail.title)) openCalendar(detail.date);
  });
  openButton.addEventListener("click", openUpcomingCalendar);
  document.getElementById("quick-view-school-calendar")?.addEventListener("click", openUpcomingCalendar);
  document.getElementById("quick-add-calendar-event")?.addEventListener("click", () => {
    openCalendar(today);
    showEditor(today, undefined, addButton);
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
      id: editingId ?? (globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${Math.random()}`),
      title,
      date: dateInput.value,
      notes: notesInput.value.trim(),
      type: events.find(({ id }) => id === editingId)?.type,
      sample: false
    };
    events = edited ? events.map((item) => item.id === event.id ? event : item) : [...events, event];
    closeEditor();
    showMonth(event.date);
    announce(edited ? "Event updated." : "Event added.", event);
    addButton.focus();
  });
  renderUpcoming();
  syncSchoolSchedule();
})();
