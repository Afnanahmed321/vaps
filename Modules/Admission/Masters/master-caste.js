(() => {
  const get = (id) => document.getElementById(id);
  const dialog = get("caste-report");
  const body = get("caste-report-rows");
  const storageKey = get("area-form").dataset.storageKey;
  let fields = [];

  function reportRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) return saved;
    } catch {
      // Use the starter records if browser storage is unavailable.
    }
    return JSON.parse(get("record-defaults").textContent);
  }

  get("caste-report-open").addEventListener("click", () => {
    fields = reportRecords().map(({ serial, name, description }) => [serial, name, description]);
    body.replaceChildren();
    for (const record of fields) {
      const row = body.insertRow();
      for (const value of record) row.insertCell().textContent = value;
    }
    if (!fields.length) {
      const cell = body.insertRow().insertCell();
      cell.colSpan = 3;
      cell.textContent = "No records to display.";
    }
    dialog.showModal();
  });

  get("caste-report-export").addEventListener("click", () => {
    const workbook = window.createAcademicYearWorkbook(
      [["Sl.No", "Caste Name", "Caste Description"], ...fields], "Master Caste"
    );
    const url = URL.createObjectURL(workbook);
    const link = document.createElement("a");
    link.href = url;
    link.download = "master-caste-list.xlsx";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  get("caste-report-print").addEventListener("click", () => window.print());
})();
