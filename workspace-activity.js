(() => {
  const updates = document.getElementById("recent-updates-list");
  if (!updates) return;

  const notifications = document.getElementById("recent-notifications-list");
  const notificationTitle = document.getElementById("recent-notifications-title");
  const bell = document.getElementById("activity-notification-trigger");
  const today = document.getElementById("welcome-date").dateTime;
  const activityKey = "vaps-dashboard-activity";
  const calendarKey = "vaps-school-calendar";
  const reportKey = "vaps.savedReports.v1";
  const announcements = [
    { title: "Annual Day — rehearsal schedule", displayTime: "Published today", date: "2026-11-24" },
    { title: "Unit Test timetable — Classes VI–X", displayTime: "2 days ago", date: "2026-11-22" },
    { title: "Library renovation complete", displayTime: "Last week", date: "2026-11-17" }
  ];
  const formatTimestamp = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata"
  });
  const formatDay = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
  });
  const reminderEnd = new Date(today);
  reminderEnd.setUTCDate(reminderEnd.getUTCDate() + 7);
  const reminderEndDate = reminderEnd.toISOString().slice(0, 10);

  function readList(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  let calendarUpdates = readList(activityKey);

  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  }

  function renderList(list, entries, emptyMessage, numbered = false) {
    if (!entries.length) {
      list.replaceChildren(node("li", "recent-activity-empty", emptyMessage));
      return;
    }

    list.replaceChildren(...entries.map((entry, index) => {
      const row = node("li", "recent-activity-row");
      const label = numbered
        ? node("span", "recent-activity-number", String(index + 1))
        : node("span", "recent-activity-category", entry.category);
      if (numbered) label.setAttribute("aria-hidden", "true");
      const copy = node("div", "recent-activity-copy");
      const title = node("strong", "", entry.title);
      const time = node("time", "", entry.displayTime);
      time.dateTime = entry.date;
      copy.append(title, time);
      row.append(label, copy);
      if (entry.href) {
        const view = node("a", "recent-activity-view", "View");
        view.href = entry.href;
        view.setAttribute("aria-label", `View ${entry.title}`);
        row.append(view);
      }
      return row;
    }));
  }

  function render() {
    const reports = readList(reportKey)
      .filter(({ id, title }) => typeof id === "string" && typeof title === "string")
      .map(({ id, title, createdAt }) => ({
        title,
        date: createdAt,
        href: "../../Reports/html%20%26%20css%20files/reports.html?report=" + encodeURIComponent(id)
      }));

    const recent = [...calendarUpdates, ...reports, ...announcements]
      .filter(({ date, title }) => typeof title === "string" && Number.isFinite(Date.parse(date)))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 6)
      .map((entry) => ({ ...entry, displayTime: entry.displayTime ?? formatTimestamp.format(new Date(entry.date)) }));
    renderList(updates, recent, "Calendar changes and saved reports will appear here.", true);

    const reminders = readList(calendarKey)
      .filter(({ date, title, sample }) => !sample && typeof title === "string"
        && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))
        && date >= today && date <= reminderEndDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ date, title }) => ({
        category: date === today ? "Today" : "Upcoming",
        date, title,
        displayTime: formatDay.format(new Date(date))
      }));

    renderList(notifications, reminders, "No calendar reminders for the next seven days.");
    bell.querySelector("b").hidden = reminders.length === 0;
    bell.setAttribute("aria-label", reminders.length
      ? `View notifications (${reminders.length} calendar reminders)`
      : "View notifications");
  }

  window.addEventListener("vaps:calendar-change", ({ detail }) => {
    calendarUpdates = [{
      category: detail.action,
      title: detail.title,
      date: new Date().toISOString()
    }, ...calendarUpdates].slice(0, 30);
    try {
      localStorage.setItem(activityKey, JSON.stringify(calendarUpdates));
    } catch {}
    render();
  });
  window.addEventListener("vaps:report-saved", render);
  window.addEventListener("storage", ({ key }) => {
    if (key === activityKey || key === null) calendarUpdates = readList(activityKey);
    if ([activityKey, calendarKey, reportKey, null].includes(key)) render();
  });

  bell.addEventListener("click", () => notificationTitle.focus());
  render();
})();
