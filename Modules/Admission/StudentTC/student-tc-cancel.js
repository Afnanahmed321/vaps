(() => {
  const get = (id) => document.getElementById(id);
  const { years, populate } = window.AdmissionOptions;
  const academicYear = "2026-2027";
  const history = [
    [1, "Muhammad Rasheed Asad · 6981", 187, "17/07/2026", "Student Left details was showing current year - instead of 2025-26", "17/07/2026, 15:23:25"],
    [2, "Jyothika Menon · TBHS001", 2410, "23/10/2026", "REJOIN", "23/10/2026, 16:58:57"],
    [3, "NAVNITHA V A · a122", 12, "06/11/2026", "REJOIN", "06/11/2026, 15:21:12"]
  ];
  const year = get("tc-cancel-year");
  const student = get("tc-cancel-student");
  const students = get("tc-cancel-students");
  const search = get("tc-cancel-search");
  const size = get("tc-cancel-size");
  const rows = get("tc-cancel-rows");
  const print = get("tc-cancel-print");
  const sortButtons = [...document.querySelectorAll(".tc-cancel-table [data-column]")];
  const pageButtons = [...document.querySelectorAll(".tc-cancel-pagination [data-page]")];
  let roster = [];
  let matches = [];
  let sort = 0;
  let direction = 1;
  let page = 1;
  let lastPage = 1;

  function updateYears() {
    const selected = year.value || academicYear;
    populate(year, [academicYear, ...years(), ...roster.map((record) => record.year)]);
    year.value = selected;
  }

  function updateStudents() {
    const names = roster.filter((record) => record.year === year.value).map((record) =>
      `${[record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ")} · ${record.admissionNo}`);
    if (year.value === academicYear) names.push(...history.map((record) => record[1]));
    students.replaceChildren(...Array.from(new Set(names), (name) => new Option(name, name)));
  }

  function drawRows(records) {
    rows.replaceChildren();
    for (const record of records) {
      const row = rows.insertRow();
      for (const value of record) row.insertCell().textContent = value;
    }
    if (!records.length) {
      const empty = rows.insertRow().insertCell();
      empty.colSpan = sortButtons.length;
      empty.className = "tc-cancel-empty";
      empty.textContent = "No cancellations match these filters.";
    }
  }

  function sortValue(record) {
    if (sort !== 3 && sort !== 5) return String(record[sort]);
    const [day, month, rest] = record[sort].split("/");
    return `${rest.slice(0, 4)}-${month}-${day}${rest.slice(4)}`;
  }

  function render() {
    const studentQuery = student.value.trim().toLowerCase();
    const query = search.value.trim().toLowerCase();
    matches = year.value === academicYear ? history.filter((record) =>
      record[1].toLowerCase().includes(studentQuery) &&
      record.some((value) => String(value).toLowerCase().includes(query))) : [];
    matches.sort((a, b) => direction * sortValue(a).localeCompare(sortValue(b), undefined, { numeric: true }));
    const count = Number(size.value);
    lastPage = Math.max(1, Math.ceil(matches.length / count));
    page = Math.max(1, Math.min(page, lastPage));
    const start = (page - 1) * count;
    drawRows(matches.slice(start, start + count));
    get("tc-cancel-range").textContent = matches.length
      ? `Showing ${start + 1} to ${Math.min(start + count, matches.length)} of ${matches.length} entries`
      : "No entries found";
    print.disabled = !matches.length;
    for (const button of pageButtons) {
      button.disabled = ["first", "prev"].includes(button.dataset.page) ? page === 1 : page === lastPage;
    }
    for (const button of sortButtons) {
      button.closest("th").setAttribute("aria-sort", Number(button.dataset.column) === sort
        ? (direction === 1 ? "ascending" : "descending") : "none");
    }
  }

  function resetPage() { page = 1; render(); }
  year.addEventListener("change", () => {
    student.value = "";
    updateStudents();
    resetPage();
  });
  student.addEventListener("input", resetPage);
  search.addEventListener("input", resetPage);
  size.addEventListener("change", resetPage);
  for (const button of sortButtons) button.addEventListener("click", () => {
    const column = Number(button.dataset.column);
    direction = sort === column ? -direction : 1;
    sort = column;
    resetPage();
  });
  for (const button of pageButtons) button.addEventListener("click", () => {
    page = { first: 1, prev: page - 1, next: page + 1, last: lastPage }[button.dataset.page];
    render();
  });

  print.addEventListener("click", () => window.print());
  window.addEventListener("beforeprint", () => drawRows(matches));
  window.addEventListener("afterprint", render);

  updateYears();
  updateStudents();
  render();
  window.AdmissionRecords.readRecords().then((records) => {
    roster = records;
    updateYears();
    updateStudents();
  }).catch(() => {});
})();
