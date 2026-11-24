(() => {
  const records = [
    ["2016-2017", "2016-08-01", "2017-07-31", "2016-05-01", 9],
    ["2017-2018", "2017-08-01", "2018-07-31", "2017-07-01", 10],
    ["2018-2019", "2018-08-01", "2019-07-31", "2018-07-01", 11],
    ["2019-2020", "2019-05-27", "2020-06-30", "2019-06-01", 12],
    ["2014-2015", "2014-04-01", "2015-03-31", "2014-04-01", 7],
    ["2013-2014", "2013-04-01", "2014-03-31", "2013-04-01", 6],
    ["2011-2012", "2011-04-01", "2012-03-31", "2011-04-01", 4],
    ["2008-2009", "2008-04-01", "2009-03-31", "2008-04-01", 1],
    ["2009-2010", "2009-04-01", "2010-03-31", "2009-04-01", 2],
    ["2015-2016", "2015-04-01", "2016-03-31", "2015-04-01", 8]
  ].map(([year, from, to, cutoff, order], index) => ({
    serial: index + 1, institute: "Tunbridge High School", year, from, to, cutoff,
    order, preadmission: false, active: true
  }));
  const storageKey = "vaps-admission-academic-years";
  let years = records.map(record => ({ ...record }));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.length === records.length && saved.every((year, index) =>
      year?.serial === records[index].serial && typeof year.year === "string" &&
      typeof year.institute === "string" && [year.from, year.to, year.cutoff].every(date => /^\d{4}-\d{2}-\d{2}$/.test(date)) &&
      Number.isSafeInteger(year.order) && typeof year.active === "boolean" && typeof year.preadmission === "boolean"
    ) && saved.filter(year => year.preadmission).length <= 1) years = saved;
  } catch {}

  const get = id => document.getElementById(id);
  const search = get("year-search");
  const pageSize = get("year-page-size");
  const rows = get("year-rows");
  const range = get("year-range");
  const pagination = get("year-pagination");
  const empty = get("year-empty");
  const feedback = get("year-feedback");
  const dialog = get("year-dialog");
  const editForm = get("year-edit-form");
  const details = get("year-details");
  const orderForm = get("year-order-form");
  const orderList = get("year-order-list");
  const orderError = get("year-order-error");
  const sortButtons = [...document.querySelectorAll(".academic-year-table .sort-button")];
  let sortKey = "serial";
  let direction = 1;
  let page = 1;
  let editingYear;
  let reportPage = 1;
  const reportPageSize = 10;
  const reportSeed = [
    ["2026-2027", "2026-04-01", "2027-03-31"],
    ["2025-2026", "2025-04-01", "2026-06-15"],
    ["2024-2025", "2024-04-01", "2025-10-01"],
    ["2023-2024", "2023-04-01", "2024-03-31"],
    ["2020-2021", "2020-06-10", "2021-05-31"],
    ["2022-2023", "2022-06-01", "2023-03-31"],
    ["2021-2022", "2021-04-01", "2022-03-31"],
    ["2009-2010", "2009-04-01", "2010-03-31"],
    ["2008-2009", "2008-04-01", "2009-03-31"],
    ["2012-2013", "2012-04-01", "2013-03-31"]
  ];

  const formatDate = date => date.split("-").reverse().join("-");
  const flagText = year => year.preadmission ? "Yes" : "No";
  const statusText = year => year.active ? "Active" : "Inactive";

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function createEditIcon() {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    for (const shape of ["M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6", "M10 14l1-4 7.5-7.5a2.1 2.1 0 0 1 3 3L14 13z"]) {
      const path = document.createElementNS(namespace, "path");
      path.setAttribute("d", shape);
      svg.append(path);
    }
    return svg;
  }

  function save(message) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(years));
      feedback.textContent = message;
    } catch {
      feedback.textContent = message + " Browser storage is unavailable. Changes last until this page is closed.";
    }
  }

  function matchingYears() {
    const query = search.value.trim().toLowerCase();
    return years.filter(year => [
      year.institute, year.year, formatDate(year.from), formatDate(year.to), formatDate(year.cutoff),
      year.order, flagText(year), statusText(year)
    ].some(value => String(value).toLowerCase().includes(query))).sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      const comparison = typeof x === "string" ? x.localeCompare(y, undefined, { numeric: true }) : Number(x) - Number(y);
      return comparison * direction || a.serial - b.serial;
    });
  }

  function createRow(year) {
    const row = element("tr");
    [year.serial, year.institute, year.year, formatDate(year.from), formatDate(year.to), formatDate(year.cutoff), year.order]
      .forEach(value => row.append(element("td", value)));
    const flag = element("td");
    flag.append(element("span", flagText(year), year.preadmission ? "year-flag is-set" : "year-flag"));
    row.append(flag);

    const action = element("td");
    const controls = element("div", undefined, "year-row-actions");
    const edit = element("button", undefined, "icon-button year-edit-button");
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit ${year.year}`);
    edit.setAttribute("aria-haspopup", "dialog");
    edit.append(createEditIcon());
    edit.addEventListener("click", () => openEditor(year));

    const status = element("label", undefined, "year-status");
    const label = element("span", statusText(year));
    const toggle = element("input");
    toggle.type = "checkbox";
    toggle.checked = year.active;
    toggle.setAttribute("aria-label", `Active for ${year.year}`);
    toggle.addEventListener("change", () => {
      year.active = toggle.checked;
      label.textContent = statusText(year);
      save(`${year.year} marked ${statusText(year).toLowerCase()}.`);
      if (search.value.trim()) render();
    });

    status.append(label, toggle);
    controls.append(edit, status);
    action.append(controls);
    row.append(action);
    return row;
  }

  function pageButton(label, target, disabled = false, current = false, symbol = label) {
    const button = element("button", symbol, "page-button");
    button.type = "button";
    button.disabled = disabled;
    button.setAttribute("aria-label", label);
    if (current) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "page");
    }
    button.addEventListener("click", () => {
      page = target;
      render();
      pagination.querySelector('[aria-current="page"]')?.focus();
    });
    return button;
  }

  function render() {
    const filtered = matchingYears();
    const size = Number(pageSize.value);
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(page, pages);
    const start = (page - 1) * size;
    rows.replaceChildren(...filtered.slice(start, start + size).map(createRow));
    empty.hidden = filtered.length > 0;
    range.textContent = filtered.length
      ? `Showing ${start + 1}–${Math.min(start + size, filtered.length)} of ${filtered.length} entries`
      : "Showing 0 entries";
    pagination.replaceChildren(
      pageButton("First page", 1, page === 1, false, "«"),
      pageButton("Previous page", page - 1, page === 1, false, "‹"),
      ...Array.from({ length: pages }, (_, index) => pageButton(`Page ${index + 1}`, index + 1, false, page === index + 1, index + 1)),
      pageButton("Next page", page + 1, page === pages, false, "›"),
      pageButton("Last page", pages, page === pages, false, "»")
    );
    sortButtons.forEach(button => button.closest("th").setAttribute("aria-sort",
      button.dataset.sort === sortKey ? (direction === 1 ? "ascending" : "descending") : "none"));
    window.lucide?.createIcons();
  }

  function openDialog(view, title) {
    [details, editForm, orderForm].forEach(panel => { panel.hidden = panel !== view; });
    dialog.classList.toggle("is-report", view === details);
    get("year-dialog-title").textContent = title;
    dialog.showModal();
  }

  function reportRows() {
    const edits = new Map(records.map((record, index) => [record.year, years[index]]));
    const listedYears = new Set(reportSeed.map(([year]) => year));
    const report = reportSeed.map(([year, from, to]) => edits.get(year) ?? { year, from, to });
    report.push(...years.filter((_, index) => !listedYears.has(records[index].year)));
    return report.map(({ year, from, to }, index) => [
      index + 1, year, formatDate(from).replaceAll("-", "/"), formatDate(to).replaceAll("-", "/")
    ]);
  }

  function renderReport(includeAll = false) {
    const records = reportRows();
    const pageCount = Math.ceil(records.length / reportPageSize);
    const first = includeAll ? 0 : (reportPage - 1) * reportPageSize;
    const visible = includeAll ? records : records.slice(first, first + reportPageSize);
    get("year-report-rows").replaceChildren(...visible.map((record) => {
      const row = element("tr");
      record.forEach(value => row.append(element("td", value)));
      return row;
    }));
    get("year-report-range").textContent = `Showing ${first + 1}–${first + visible.length} of ${records.length} entries`;
    get("year-report-page").textContent = `Page ${reportPage} of ${pageCount}`;
    get("year-report-previous").disabled = reportPage === 1;
    get("year-report-next").disabled = reportPage === pageCount;
  }

  function openEditor(year) {
    editingYear = year;
    for (const key of ["institute", "year", "from", "to", "cutoff"]) editForm.elements.namedItem(key).value = year[key];
    editForm.elements.preadmission.checked = year.preadmission;
    editForm.elements.to.setCustomValidity("");
    editForm.elements.institute.setCustomValidity("");
    openDialog(editForm, `Edit academic year ${year.year}`);
  }

  get("year-view-details").addEventListener("click", () => {
    reportPage = 1;
    renderReport();
    dialog.scrollTop = 0;
    openDialog(details, "Academic Year List");
  });

  for (const [id, direction] of [["year-report-previous", -1], ["year-report-next", 1]]) {
    get(id).addEventListener("click", () => {
      reportPage += direction;
      renderReport();
      get("year-report-heading").scrollIntoView({ block: "nearest" });
    });
  }

  get("year-report-print").addEventListener("click", () => window.print());
  window.addEventListener("beforeprint", () => {
    if (dialog.open && !details.hidden) renderReport(true);
  });
  window.addEventListener("afterprint", () => {
    if (dialog.open && !details.hidden) renderReport();
  });

  get("year-report-excel").addEventListener("click", () => {
    const workbook = window.createAcademicYearWorkbook([
      ["Sl No", "Academic Year", "From Date", "To Date"],
      ...reportRows()
    ]);
    const url = URL.createObjectURL(workbook);
    const link = element("a");
    link.href = url;
    link.download = "academic-year-list.xlsx";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  get("year-set-order").addEventListener("click", () => {
    orderError.textContent = "";
    orderList.replaceChildren(...[...years].sort((a, b) => a.order - b.order).map(year => {
      const label = element("label");
      const field = element("input");
      field.type = "number";
      field.name = String(year.serial);
      field.min = "1";
      field.step = "1";
      field.required = true;
      field.value = year.order;
      label.append(element("span", year.year), field);
      return label;
    }));
    openDialog(orderForm, "Set academic year order");
  });

  editForm.addEventListener("input", () => {
    editForm.elements.to.setCustomValidity("");
    editForm.elements.institute.setCustomValidity("");
  });
  editForm.addEventListener("submit", event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(editForm));
    if (!values.institute.trim()) {
      editForm.elements.institute.setCustomValidity("Enter an institute name.");
      editForm.elements.institute.reportValidity();
      return;
    }
    if (values.to < values.from) {
      editForm.elements.to.setCustomValidity("To Date must be on or after From Date.");
      editForm.elements.to.reportValidity();
      return;
    }
    const flag = editForm.elements.preadmission.checked;
    if (flag) years.forEach(year => { year.preadmission = false; });
    Object.assign(editingYear, {
      institute: values.institute.trim(), year: values.year.trim(), from: values.from,
      to: values.to, cutoff: values.cutoff, preadmission: flag
    });
    save("Academic year updated.");
    dialog.close();
    render();
  });

  orderForm.addEventListener("input", () => { orderError.textContent = ""; });
  orderForm.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(orderForm);
    const orders = years.map(year => Number(form.get(String(year.serial))));
    if (orders.some(order => !Number.isSafeInteger(order) || order < 1) || new Set(orders).size !== orders.length) {
      orderError.textContent = "Use a different positive whole number for each academic year.";
      return;
    }
    years.forEach((year, index) => { year.order = orders[index]; });
    sortKey = "order";
    direction = 1;
    page = 1;
    save("Academic year order saved.");
    dialog.close();
    render();
  });

  get("year-dialog-close").addEventListener("click", () => dialog.close());
  dialog.querySelectorAll("[data-close-year-dialog]").forEach(button => button.addEventListener("click", () => dialog.close()));
  for (const [control, event] of [[search, "input"], [pageSize, "change"]]) {
    control.addEventListener(event, () => { page = 1; render(); });
  }
  sortButtons.forEach(button => button.addEventListener("click", () => {
    direction = sortKey === button.dataset.sort ? -direction : 1;
    sortKey = button.dataset.sort;
    page = 1;
    render();
  }));
  render();
})();
