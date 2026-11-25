window.AdmissionRecords = (() => {
  const database = new Promise((resolve, reject) => {
    const request = indexedDB.open("vaps-admission", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("students", { keyPath: "serial", autoIncrement: true });
      store.createIndex("yearAdmissionNo", ["year", "admissionNo"], { unique: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  async function readRecords() {
    const db = await database;
    return new Promise((resolve, reject) => {
      const request = db.transaction("students").objectStore("students").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeRecord(record) {
    const db = await database;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("students", "readwrite");
      const request = transaction.objectStore("students").put(record);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(request.error || transaction.error);
    });
  }

  return { readRecords, writeRecord };
})();
