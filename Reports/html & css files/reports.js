const reportStorageKey = "vaps.savedReports.v1";
const savedReportList = document.querySelector("#saved-report-list");
const savedReportCount = document.querySelector("#saved-report-count");
const storageError = document.querySelector("#storage-error");
const reportLinkError = document.querySelector("#report-link-error");
const categoryFilter = document.querySelector("#report-category-filter");
const fromDateFilter = document.querySelector("#report-date-from");
const toDateFilter = document.querySelector("#report-date-to");
const filterError = document.querySelector("#report-filter-error");
const resultsCount = document.querySelector("#report-results-count");
const reportDialog = document.querySelector("#report-detail-dialog");
const reportDialogClose = reportDialog.querySelector(".report-detail-close");
const savedReportsHeading = document.querySelector("#saved-reports-title");

let savedReports = [];
let lastFocusedElement = null;

function showStorageError(message, error) {
  storageError.textContent = message;
  storageError.hidden = false;
  if (error) console.error("Reports storage error:", error);
}

function isReportRecord(value) {
  return value
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.question === "string"
    && typeof value.createdAt === "string"
    && Array.isArray(value.metrics)
    && Array.isArray(value.columns)
    && Array.isArray(value.rows);
}

function loadSavedReports() {
  try {
    const stored = window.localStorage.getItem(reportStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) throw new TypeError("Saved reports must be a list.");
    return parsed.filter(isReportRecord);
  } catch (error) {
    showStorageError("Saved reports could not be loaded from this browser. Check storage permissions and reload the page.", error);
    return [];
  }
}

function formatCreatedAt(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Saved report";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function getLocalDateKey(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getReportCategory(report) {
  return report.categoryLabel || report.category || "Other";
}

function cleanSampleCopy(value) {
  const cleaned = String(value ?? "")
    .replace(/\bcurrent\s+sample\s+period\b/gi, "Current period")
    .replace(/\bin\s+this\s+sample\b/gi, "in this report")
    .replace(/\bsample\b\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "";
}

function createMetricCard(metric, index = 0) {
  const card = document.createElement("article");
  card.className = "report-metric";
  const icon = document.createElement("span");
  icon.className = "report-metric-icon";
  const iconElement = document.createElement("i");
  iconElement.setAttribute("data-lucide", ["chart-no-axes-column-increasing", "layers-3", "trending-up"][index % 3]);
  icon.append(iconElement);
  const label = document.createElement("span");
  label.className = "report-metric-label";
  label.textContent = metric.label || "Metric";
  const value = document.createElement("strong");
  value.textContent = metric.value ?? "—";
  card.append(icon, label, value);
  if (metric.detail) {
    const detail = document.createElement("small");
    detail.textContent = cleanSampleCopy(metric.detail);
    card.append(detail);
  }
  return card;
}

function openReport(report, trigger = document.activeElement) {
  lastFocusedElement = trigger instanceof HTMLElement && trigger !== document.body
    ? trigger
    : savedReportsHeading;
  document.querySelector("#report-detail-title").textContent = report.title;
  document.querySelector("#report-detail-question").textContent = report.question ? `Asked: ${report.question}` : "";
  document.querySelector("#report-detail-period").textContent = `${cleanSampleCopy(report.period || "Saved period")} · Generated ${formatCreatedAt(report.createdAt)}`;

  const metricContainer = document.querySelector("#report-detail-metrics");
  const visibleMetrics = report.metrics.filter((metric) =>
    !/\boutstanding\b/i.test(metric.label || "")
  );
  metricContainer.replaceChildren(...visibleMetrics.map(createMetricCard));

  const tableHead = document.querySelector("#report-detail-table-head");
  const headingRow = document.createElement("tr");
  report.columns.forEach((column) => {
    const heading = document.createElement("th");
    heading.scope = "col";
    heading.textContent = column;
    headingRow.append(heading);
  });
  const amountColumnIndex = report.columns.findIndex((column) => /amount|total|fee|collection|balance/i.test(column));
  const amountValues = amountColumnIndex < 0
    ? []
    : report.rows.map((row) => Number(String(row[amountColumnIndex] ?? "").replace(/[^\d.-]/g, "")) || 0);
  const amountTotal = amountValues.reduce((total, value) => total + Math.max(value, 0), 0);
  const hasAmountShares = amountTotal > 0 && amountValues.some((value) => value > 0);
  tableHead.closest("table").classList.toggle("has-shares", hasAmountShares);
  if (hasAmountShares) {
    const shareHeading = document.createElement("th");
    shareHeading.scope = "col";
    shareHeading.textContent = "Share";
    headingRow.append(shareHeading);
  }
  tableHead.replaceChildren(headingRow);

  const tableBody = document.querySelector("#report-detail-table-body");
  const rows = report.rows.map((row, rowIndex) => {
    const tableRow = document.createElement("tr");
    row.forEach((cell, columnIndex) => {
      const tableCell = document.createElement("td");
      const paymentIcon = columnIndex === 0
        ? { upi: "smartphone", card: "credit-card", cash: "banknote" }[String(cell ?? "").trim().toLowerCase()]
        : null;
      if (paymentIcon) {
        tableCell.className = "report-method-cell";
        const iconWrap = document.createElement("span");
        iconWrap.className = `report-method-icon report-method-icon-${String(cell).trim().toLowerCase()}`;
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", paymentIcon);
        iconWrap.append(icon);
        const label = document.createElement("span");
        label.textContent = cell;
        tableCell.append(iconWrap, label);
      } else {
        tableCell.textContent = cell ?? "";
      }
      tableRow.append(tableCell);
    });
    if (hasAmountShares) {
      const share = Math.round((Math.max(amountValues[rowIndex], 0) / amountTotal) * 100);
      const shareCell = document.createElement("td");
      shareCell.className = "report-share-cell";
      shareCell.setAttribute("aria-label", `${share}% of total`);
      const track = document.createElement("span");
      track.className = "report-share-track";
      track.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.className = "report-share-fill";
      fill.style.width = `${share}%`;
      track.append(fill);
      const percent = document.createElement("strong");
      percent.textContent = `${share}%`;
      shareCell.append(track, percent);
      tableRow.append(shareCell);
    }
    return tableRow;
  });
  tableBody.replaceChildren(...rows);
  document.querySelector("#report-detail-summary").textContent = cleanSampleCopy(report.summary || "No summary is available for this saved report.");

  reportDialog.showModal();
  if (window.lucide) window.lucide.createIcons();
}

function renderSavedReports() {
  savedReportList.replaceChildren();
  savedReportCount.textContent = String(savedReports.length);
  updateCategoryOptions();

  if (!savedReports.length) {
    resultsCount.textContent = "No saved reports";
    const empty = document.createElement("div");
    empty.className = "saved-empty";
    const iconWrap = document.createElement("span");
    const icon = document.createElement("i");
    icon.dataset.lucide = "bookmark";
    iconWrap.append(icon);
    const heading = document.createElement("strong");
    heading.textContent = "No saved reports yet";
    const description = document.createElement("p");
    description.textContent = "Reports generated with /reports in Principal Assistant will appear here.";
    empty.append(iconWrap, heading, description);
    savedReportList.append(empty);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const fromDate = fromDateFilter.value;
  const toDate = toDateFilter.value;
  if (fromDate && toDate && fromDate > toDate) {
    filterError.textContent = "The start date must be on or before the end date.";
    filterError.hidden = false;
    resultsCount.textContent = "";
    renderEmptyResults("Adjust the date range to see matching reports.");
    return;
  }
  filterError.hidden = true;

  const selectedCategory = categoryFilter.value;
  const matchingReports = savedReports.filter((report) => {
    const categoryMatches = !selectedCategory || getReportCategory(report) === selectedCategory;
    const date = getLocalDateKey(report.createdAt);
    const fromDateMatches = !fromDate || (date && date >= fromDate);
    const toDateMatches = !toDate || (date && date <= toDate);
    return categoryMatches && fromDateMatches && toDateMatches;
  });
  const hasFilters = Boolean(selectedCategory || fromDate || toDate);
  resultsCount.textContent = hasFilters
    ? `Showing ${matchingReports.length} of ${savedReports.length} saved reports`
    : `Showing ${savedReports.length} saved report${savedReports.length === 1 ? "" : "s"}`;

  if (!matchingReports.length) {
    renderEmptyResults("No saved reports match these filters.");
    return;
  }

  matchingReports.forEach((report) => {
    const item = document.createElement("button");
    item.className = "saved-report-item";
    item.type = "button";
    item.setAttribute("aria-label", `Open ${report.title}`);

    const iconWrap = document.createElement("span");
    iconWrap.className = "saved-report-icon";
    const icon = document.createElement("i");
    icon.dataset.lucide = report.icon || "file-text";
    iconWrap.append(icon);

    const copy = document.createElement("span");
    copy.className = "saved-report-copy";
    const title = document.createElement("strong");
    title.textContent = report.title;
    const date = document.createElement("small");
    date.textContent = `${getReportCategory(report)} · ${formatCreatedAt(report.createdAt)}`;
    copy.append(title, date);

    const openIconWrap = document.createElement("span");
    openIconWrap.className = "saved-report-open-icon";
    const openIcon = document.createElement("i");
    openIcon.dataset.lucide = "arrow-up-right";
    openIconWrap.append(openIcon);

    item.append(iconWrap, copy, openIconWrap);
    item.addEventListener("click", () => openReport(report, item));
    savedReportList.append(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

function updateCategoryOptions() {
  const selectedValue = categoryFilter.value;
  const categories = [...new Set(savedReports.map(getReportCategory))]
    .sort((first, second) => first.localeCompare(second));
  const options = [new Option("All categories", "")];
  categories.forEach((category) => options.push(new Option(category, category)));
  categoryFilter.replaceChildren(...options);
  if (categories.includes(selectedValue)) categoryFilter.value = selectedValue;
}

function renderEmptyResults(message) {
  const empty = document.createElement("div");
  empty.className = "saved-empty";
  const iconWrap = document.createElement("span");
  const icon = document.createElement("i");
  icon.dataset.lucide = "file-search";
  iconWrap.append(icon);
  const heading = document.createElement("strong");
  heading.textContent = message;
  empty.append(iconWrap, heading);
  savedReportList.replaceChildren(empty);
  if (window.lucide) window.lucide.createIcons();
}

reportDialogClose.addEventListener("click", () => reportDialog.close());

reportDialog.addEventListener("click", (event) => {
  const bounds = reportDialog.getBoundingClientRect();
  const clickedBackdrop = event.clientX < bounds.left
    || event.clientX > bounds.right
    || event.clientY < bounds.top
    || event.clientY > bounds.bottom;
  if (clickedBackdrop) reportDialog.close();
});

reportDialog.addEventListener("close", () => {
  if (lastFocusedElement && lastFocusedElement.isConnected) lastFocusedElement.focus();
  lastFocusedElement = null;
});

categoryFilter.addEventListener("change", renderSavedReports);
fromDateFilter.addEventListener("change", renderSavedReports);
toDateFilter.addEventListener("change", renderSavedReports);
document.querySelector("#clear-report-filters").addEventListener("click", () => {
  categoryFilter.value = "";
  fromDateFilter.value = "";
  toDateFilter.value = "";
  renderSavedReports();
});

savedReports = loadSavedReports();
renderSavedReports();

const requestedReportId = new URLSearchParams(window.location.search).get("report");
if (requestedReportId) {
  const requestedReport = savedReports.find((report) => report.id === requestedReportId);
  if (requestedReport) {
    openReport(requestedReport, savedReportsHeading);
  } else {
    reportLinkError.textContent = "This assistant report was not found in your Saved Reports. Please generate it again.";
    reportLinkError.hidden = false;
  }
}

window.addEventListener("storage", (event) => {
  if (event.key !== reportStorageKey && event.key !== null) return;
  savedReports = loadSavedReports();
  renderSavedReports();
});
