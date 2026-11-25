(() => {
  const form = document.getElementById("record-assistant-form");
  const dialog = document.getElementById("assistant-answer-dialog");
  if (!dialog) return;
  const status = document.getElementById("record-assistant-status");
  const sources = document.getElementById("assistant-response-sources");
  const pins = document.getElementById("record-assistant-pins");
  const pinKey = "vaps-workspace-assistant-pins";
  const targets = {
    calendar: "#important-dates-title",
    report: "../../Reports/html%20%26%20css%20files/reports.html#saved-reports-title",
    year: "../../Modules/Admission/Masters/academic-year.html"
  };
  const stopWords = new Set("what when where which how many is are do does can i me the an a and for to did it us my of school next upcoming saved show list dates records".split(" "));
  const tokens = (input) => input.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter((word) => !stopWords.has(word)) ?? [];
  const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));

  function readList(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data.filter((entry) => entry && typeof entry === "object") : [];
    } catch {
      return [];
    }
  }

  function scoreRecord(record, keywords) {
    const words = tokens(record);
    return keywords.reduce((score, word) => score + Number(words.includes(word) || words.includes(word.replace(/s$/, ""))), 0);
  }

  function findRecords(question) {
    const date = document.getElementById("welcome-date").dateTime;
    const keywords = tokens(question);
    const asksCalendar = /calendar|events?|holiday|ptm|meeting|fee (?:due|payment|deadline)|exam dates?|assessments?|deadline/i.test(question);
    const asksReport = /reports?/i.test(question);
    const asksYear = /academic year|admission (?:open|cutoff)/i.test(question);
    const asksUpcoming = /\b(next|upcoming|future)\b/i.test(question);
    const calendar = readList("vaps-school-calendar")
      .filter((event) => !event.sample && typeof event.title === "string" && isDate(event.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((event) => !asksUpcoming || event.date >= date)
      .map((event) => ({
        type: "calendar", label: event.title, detail: event.date,
        score: scoreRecord(`${event.title} ${event.type || ""}`, keywords)
      }));
    const specificCalendar = keywords.filter((word) => !["calendar", "event", "events"].includes(word));
    const reports = readList("vaps.savedReports.v1")
      .filter((report) => typeof report.title === "string" && typeof report.createdAt === "string" && Number.isFinite(Date.parse(report.createdAt)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((report) => ({
        type: "report", label: report.title,
        detail: `Saved ${report.createdAt.slice(0, 10)} · Report metadata`,
        score: scoreRecord(`${report.title} ${report.categoryLabel || ""}`, keywords)
      }));
    const years = readList("vaps-admission-academic-years")
      .filter((year) => typeof year.year === "string" && isDate(year.from) && isDate(year.to))
      .map((year) => ({
        type: "year", label: year.year,
        detail: `${year.from} to ${year.to}${isDate(year.cutoff) ? ` · Cutoff ${year.cutoff}` : ""}`,
        score: scoreRecord(year.year, keywords)
      }));
    const matchingCalendar = calendar.filter((event) => specificCalendar.length ? event.score > 0 : asksCalendar);
    const matchingReports = reports.filter((report) => asksReport &&
      (keywords.every((word) => ["report", "reports"].includes(word)) || report.score > 0));
    const matchingYears = years.filter((year) => asksYear &&
      (!keywords.some((word) => /^\d{4}$/.test(word)) || year.score > 0));
    const bestCalendarScore = matchingCalendar.reduce((best, { score }) => Math.max(best, score), 0);
    const preferredCalendar = specificCalendar.length
      ? matchingCalendar.filter(({ score }) => score === bestCalendarScore)
      : matchingCalendar;
    const calendarResults = /\bnext\b/i.test(question) ? preferredCalendar.slice(0, 1) : preferredCalendar;
    return [...calendarResults, ...matchingReports, ...matchingYears].slice(0, 5);
  }

  function makeAnswer(question) {
    const records = findRecords(question);
    return {
      question,
      text: records.length
        ? records.map(({ label, detail }) => `${label} — ${detail}`).join("\n")
        : "I couldn’t find a matching saved record. The assistant can look up saved calendar events, saved report titles, and saved academic year dates. Live attendance, grades, and fee records aren’t connected.",
      records
    };
  }

  let current;
  const pinButton = document.getElementById("record-assistant-pin");
  function show(answer) {
    current = answer;
    status.textContent = "";
    document.getElementById("assistant-answer-question").textContent = answer.question;
    document.getElementById("assistant-response-text").textContent = answer.text;
    document.getElementById("assistant-response").hidden = false;
    sources.replaceChildren(...answer.records.map(({ type, label, detail }) => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = targets[type];
      link.textContent = `${label} · ${detail}`;
      if (type === "calendar") link.addEventListener("click", (event) => {
        event.preventDefault();
        dialog.close();
        window.dispatchEvent(new CustomEvent("vaps:calendar-open-event", { detail: { date: detail, title: label } }));
      });
      row.append(link);
      return row;
    }));
    pinButton.disabled = !answer.records.length;
    if (!dialog.open) dialog.showModal();
  }

  const ask = (question) => {
    const value = question.trim();
    if (value) show(makeAnswer(value));
  };
  const savedPins = () => readList(pinKey).filter((entry) =>
    typeof entry.question === "string" && typeof entry.text === "string" && Array.isArray(entry.records) &&
    entry.records.every((record) => record && Object.hasOwn(targets, record.type) &&
      typeof record.label === "string" && typeof record.detail === "string"));

  function renderPins() {
    if (!pins) return;
    const entries = savedPins();
    pins.replaceChildren(...entries.map((entry) => {
      const row = document.createElement("li");
      const open = document.createElement("button");
      const remove = document.createElement("button");
      open.type = remove.type = "button";
      open.textContent = entry.question;
      remove.textContent = "Remove";
      open.addEventListener("click", () => show(entry));
      remove.addEventListener("click", () => {
        try {
          localStorage.setItem(pinKey, JSON.stringify(savedPins().filter(({ question }) => question !== entry.question)));
          renderPins();
          document.querySelector("#record-assistant-pinned summary").focus();
        } catch {
          remove.textContent = "Could not remove";
        }
      });
      row.append(open, remove);
      return row;
    }));
    if (!entries.length) {
      const empty = document.createElement("li");
      empty.textContent = "No pinned answers.";
      pins.append(empty);
    }
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(document.getElementById("record-assistant-question").value);
  });
  pinButton.addEventListener("click", () => {
    if (!current?.records.length) return;
    try {
      localStorage.setItem(pinKey, JSON.stringify([current, ...savedPins().filter(({ question }) => question !== current.question)].slice(0, 20)));
      status.textContent = "Answer pinned in this browser.";
      renderPins();
    } catch {
      status.textContent = "Could not save the answer in this browser.";
    }
  });
  document.getElementById("record-assistant-export").addEventListener("click", () => {
    if (!current) return;
    const text = [current.question, "", current.text, "", ...current.records.map(({ type, label, detail }) =>
      `${label} — ${detail} — ${new URL(targets[type], document.baseURI).href}`)].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "school-assistant-answer.txt";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  for (const id of ["assistant-answer-close", "assistant-answer-done"]) {
    document.getElementById(id).addEventListener("click", () => dialog.close());
  }
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  renderPins();
  window.WorkspaceRecordAssistant = { ask };
})();
