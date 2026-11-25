(() => {
  const { years, populate } = window.AdmissionOptions;
  const form = document.querySelector(".privileges-form");
  const year = document.getElementById("privileges-year");
  const staff = document.getElementById("privileges-staff");
  const feedback = document.getElementById("privileges-feedback");
  let mappings = [];

  try {
    const saved = JSON.parse(localStorage.getItem("vaps.admission.classTeacherMappings"));
    if (Array.isArray(saved)) mappings = saved.filter((record) =>
      record?.active && typeof record.year === "string" &&
      typeof record.code === "string" && typeof record.name === "string");
  } catch {
    feedback.textContent = "Saved class teacher mappings could not be loaded.";
  }

  populate(year, [...years(), ...mappings.map((record) => record.year)]);

  function updateStaff() {
    const role = new FormData(form).get("staff-role");
    const available = role === "class" && year.value
      ? mappings.filter((record) => record.year === year.value) : [];
    const uniqueStaff = new Map(available.map(({ code, name }) => [code, name]));
    populate(staff, []);
    for (const [code, name] of uniqueStaff) staff.add(new Option(`${name} (${code})`, code));
    staff.disabled = !uniqueStaff.size;

    if (!role || !year.value) feedback.textContent = "Select a role and academic year to see available staff.";
    else if (role !== "class") feedback.textContent = "A connected staff directory is required for this role.";
    else if (!uniqueStaff.size) feedback.textContent = "No active class teacher mappings are saved for this academic year.";
    else feedback.textContent = "Select a class teacher from the saved mappings.";
  }

  year.addEventListener("change", updateStaff);
  for (const role of form.querySelectorAll('[name="staff-role"]')) role.addEventListener("change", updateStaff);
  staff.addEventListener("change", () => {
    feedback.textContent = staff.value
      ? "A connected permissions service is required to view or change login privileges."
      : "Select a class teacher from the saved mappings.";
  });
  form.addEventListener("submit", (event) => event.preventDefault());
})();
