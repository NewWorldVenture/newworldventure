(function () {
  const ADMIN_EMAIL = "Daniel.Hughen@gmail.com";
  const STORAGE_KEY = "tripnestDestinations";

  const adminEmailInput = document.getElementById("adminEmail");
  const unlockAdminBtn = document.getElementById("unlockAdminBtn");
  const adminNotice = document.getElementById("adminNotice");
  const destinationSelect = document.getElementById("destinationSelect");
  const destinationForm = document.getElementById("destinationForm");
  const newDestinationBtn = document.getElementById("newDestinationBtn");

  if (!adminEmailInput || !unlockAdminBtn || !destinationForm || !destinationSelect) return;

  const fields = [
    "id",
    "name",
    "region",
    "budget",
    "image",
    "blurb",
    "highlights",
    "tags",
    "sampleDays"
  ].map((id) => document.getElementById(id));

  let canEdit = false;
  let destinations = Array.isArray(window.TRIPNEST_DATA) ? [...window.TRIPNEST_DATA] : [];

  function parseList(value) {
    return (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function sanitizeDestination(formValues) {
    return {
      id: formValues.id.trim(),
      name: formValues.name.trim(),
      region: formValues.region.trim(),
      budget: formValues.budget.trim(),
      image: formValues.image.trim(),
      blurb: formValues.blurb.trim(),
      highlights: parseList(formValues.highlights),
      tags: parseList(formValues.tags),
      sampleDays: parseList(formValues.sampleDays)
    };
  }

  function setInputsDisabled(disabled) {
    destinationSelect.disabled = disabled;
    newDestinationBtn.disabled = disabled;

    fields.forEach((field) => {
      if (field) field.disabled = disabled;
    });

    const saveBtn = document.getElementById("saveDestinationBtn");
    if (saveBtn) saveBtn.disabled = disabled;
  }

  function populateDestinationSelect() {
    destinationSelect.innerHTML =
      '<option value="">Choose a destination...</option>' +
      destinations
        .map((item, index) => `<option value="${index}">${item.name}</option>`)
        .join("");
  }

  function fillForm(item) {
    if (!item) {
      destinationForm.reset();
      return;
    }

    document.getElementById("id").value = item.id || "";
    document.getElementById("name").value = item.name || "";
    document.getElementById("region").value = item.region || "";
    document.getElementById("budget").value = item.budget || "";
    document.getElementById("image").value = item.image || "";
    document.getElementById("blurb").value = item.blurb || "";
    document.getElementById("highlights").value = (item.highlights || []).join(", ");
    document.getElementById("tags").value = (item.tags || []).join(", ");
    document.getElementById("sampleDays").value = (item.sampleDays || []).join(", ");
  }

  function persistDestinations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
    window.TRIPNEST_DATA = destinations;
  }

  unlockAdminBtn.addEventListener("click", () => {
    const enteredEmail = (adminEmailInput.value || "").trim();
    canEdit = enteredEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (canEdit) {
      adminNotice.innerHTML = "<strong>Admin unlocked.</strong><p class='muted'>All destination fields are now editable.</p>";
      setInputsDisabled(false);
      populateDestinationSelect();
      return;
    }

    adminNotice.innerHTML = "<strong>Access denied.</strong><p class='muted'>Only Daniel.Hughen@gmail.com can add or modify destinations.</p>";
    setInputsDisabled(true);
  });

  destinationSelect.addEventListener("change", () => {
    if (!canEdit) return;

    const index = Number(destinationSelect.value);
    if (!Number.isInteger(index) || index < 0) {
      destinationForm.reset();
      return;
    }

    fillForm(destinations[index]);
  });

  newDestinationBtn.addEventListener("click", () => {
    if (!canEdit) return;

    destinationSelect.value = "";
    destinationForm.reset();
  });

  destinationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canEdit) return;

    const formData = new FormData(destinationForm);
    const nextDestination = sanitizeDestination(Object.fromEntries(formData.entries()));

    if (!nextDestination.id || !nextDestination.name || !nextDestination.region || !nextDestination.budget || !nextDestination.image || !nextDestination.blurb) {
      adminNotice.innerHTML = "<strong>Missing required fields.</strong><p class='muted'>Please complete every required field before saving.</p>";
      return;
    }

    const selectedIndex = Number(destinationSelect.value);
    if (Number.isInteger(selectedIndex) && selectedIndex >= 0) {
      destinations[selectedIndex] = nextDestination;
      adminNotice.innerHTML = "<strong>Destination updated.</strong><p class='muted'>Your changes have been saved locally.</p>";
    } else {
      destinations.push(nextDestination);
      adminNotice.innerHTML = "<strong>Destination added.</strong><p class='muted'>The new destination has been saved locally.</p>";
    }

    persistDestinations();
    populateDestinationSelect();

    const matchedIndex = destinations.findIndex((item) => item.id === nextDestination.id);
    if (matchedIndex >= 0) destinationSelect.value = String(matchedIndex);
  });
})();
