window.AdmissionOptions = (() => {
  function savedOptions(key, field, defaults) {
    try {
      const records = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(records)) {
        return records.filter((record) => record?.active && typeof record[field] === "string")
          .map((record) => record[field]);
      }
    } catch {
      // Use the default choices when local browser storage is unavailable.
    }
    return defaults;
  }

  function populate(select, values) {
    select.replaceChildren(select.options[0]);
    for (const value of new Set(values)) select.add(new Option(value, value));
    select.value = "";
  }

  const lists = {
    years: () => savedOptions("vaps-admission-academic-years", "year", ["2026-2027"]),
    classes: () => savedOptions("vaps.admission.masterClasses", "name", ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]),
    sections: () => savedOptions("vaps.admission.masterSections", "name", ["A", "B", "C", "AB", "d", "Asection", "secccccccABCD", "TEST SECTION", "E SEC", "AAAAsec"])
  };
  return { ...lists, populate };
})();
