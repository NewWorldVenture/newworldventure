(function () {
  const $ = (sel) => document.querySelector(sel);

  const STORAGE_KEYS = {
    destinations: "tripnest_destinations",
    media: "tripnest_media"
  };

  const defaultDestinations = Array.isArray(window.TRIPNEST_DATA)
    ? window.TRIPNEST_DATA.map((item) => ({ ...item }))
    : [];

  const defaultMedia = {
    photos: [
      "assets/img/atlantic_city.jpeg",
      "assets/img/bermuda.jpeg",
      "assets/img/cancun.jpeg",
      "assets/img/disney.jpeg",
      "assets/img/dominican.jpeg",
      "assets/img/greece.jpeg",
      "assets/img/newyork.jpeg",
      "assets/img/philly.jpeg"
    ],
    videos: ["assets/vid/mexico.mp4"]
  };

  function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function normalizeDestinations(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && item.name)
      .map((item, index) => ({
        id: String(item.id || `${item.name}-${index}`).trim().toLowerCase().replace(/\s+/g, "_"),
        name: String(item.name || "").trim(),
        region: String(item.region || "Other").trim(),
        budget: ["$", "$$", "$$$"].includes(item.budget) ? item.budget : "$$",
        image: String(item.image || "assets/img/cancun.jpeg").trim(),
        blurb: String(item.blurb || "").trim(),
        tags: Array.isArray(item.tags) ? item.tags : [],
        highlights: Array.isArray(item.highlights) ? item.highlights : []
      }));
  }

  function normalizeMedia(media) {
    const normalized = {
      photos: Array.isArray(media?.photos) ? media.photos : [],
      videos: Array.isArray(media?.videos) ? media.videos : []
    };

    return {
      photos: normalized.photos.map((path) => String(path || "").trim()).filter(Boolean),
      videos: normalized.videos.map((path) => String(path || "").trim()).filter(Boolean)
    };
  }

  function getDestinations() {
    const fromStorage = normalizeDestinations(
      parseJson(localStorage.getItem(STORAGE_KEYS.destinations), null)
    );
    if (fromStorage.length) return fromStorage;
    const seeded = normalizeDestinations(defaultDestinations);
    if (seeded.length) {
      localStorage.setItem(STORAGE_KEYS.destinations, JSON.stringify(seeded));
    }
    return seeded;
  }

  function saveDestinations(items) {
    const normalized = normalizeDestinations(items);
    localStorage.setItem(STORAGE_KEYS.destinations, JSON.stringify(normalized));
    window.TRIPNEST_DATA = normalized;
    return normalized;
  }

  function getMedia() {
    const fromStorage = normalizeMedia(parseJson(localStorage.getItem(STORAGE_KEYS.media), null));
    if (fromStorage.photos.length || fromStorage.videos.length) return fromStorage;
    const seeded = normalizeMedia(defaultMedia);
    localStorage.setItem(STORAGE_KEYS.media, JSON.stringify(seeded));
    return seeded;
  }

  function saveMedia(media) {
    const normalized = normalizeMedia(media);
    localStorage.setItem(STORAGE_KEYS.media, JSON.stringify(normalized));
    return normalized;
  }

  function splitList(value) {
    return String(value || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function bindNavToggle() {
    const nav = document.querySelector(".nav");
    const navToggle = document.querySelector(".nav-toggle");
    if (!nav || !navToggle) return;

    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function bindVideoModal() {
    const playBtn = document.getElementById("playVideoBtn");
    const modal = document.getElementById("videoModal");
    const closeBtn = document.getElementById("closeVideo");
    const video = document.getElementById("promoVideo");

    if (video) {
      const media = getMedia();
      if (media.videos[0]) {
        video.src = media.videos[0];
      }
    }

    if (playBtn && modal && video) {
      playBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        video.play();
      });

      closeBtn?.addEventListener("click", () => {
        modal.style.display = "none";
        video.pause();
        video.currentTime = 0;
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
          video.pause();
          video.currentTime = 0;
        }
      });
    }
  }

  function renderGallery() {
    const galleryGrid = document.getElementById("galleryGrid");
    if (!galleryGrid) return;

    const media = getMedia();
    const photos = media.photos;

    galleryGrid.innerHTML = photos
      .map((imgPath) => {
        const file = imgPath.split("/").pop() || "photo";
        const alt = file.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

        return `
          <div class="gallery-item">
            <img src="${imgPath}" alt="${alt}" loading="lazy" />
          </div>
        `;
      })
      .join("");
  }

  function renderCarousel() {
    const viewport = document.getElementById("carViewport");
    const prevBtn = document.getElementById("carPrev");
    const nextBtn = document.getElementById("carNext");

    const destinationData = getDestinations();
    window.TRIPNEST_DATA = destinationData;

    if (!(viewport && destinationData.length)) return;

    let currentIndex = 0;
    let autoRotate;

    function renderSlide(index) {
      const item = destinationData[index];
      if (!item) return;

      viewport.innerHTML = `
        <div class="car-slide">
          <div class="car-image" style="background-image:url('${item.image}'); background-size:cover; background-position:center;"></div>
          <div class="car-meta">
            <div>
              <div class="car-title">${item.name}</div>
              <div class="car-sub">${item.region} • ${item.budget}</div>
            </div>
          </div>
        </div>
      `;
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % destinationData.length;
      renderSlide(currentIndex);
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + destinationData.length) % destinationData.length;
      renderSlide(currentIndex);
    }

    function startAutoRotate() {
      stopAutoRotate();
      autoRotate = setInterval(showNext, 3000);
    }

    function stopAutoRotate() {
      if (autoRotate) clearInterval(autoRotate);
    }

    nextBtn?.addEventListener("click", () => {
      showNext();
      startAutoRotate();
    });

    prevBtn?.addEventListener("click", () => {
      showPrev();
      startAutoRotate();
    });

    viewport.addEventListener("mouseenter", stopAutoRotate);
    viewport.addEventListener("mouseleave", startAutoRotate);

    renderSlide(currentIndex);
    startAutoRotate();
  }

  function renderDestinations() {
    const searchInput = document.getElementById("searchInput");
    const regionSelect = document.getElementById("regionSelect");
    const budgetSelect = document.getElementById("budgetSelect");
    const destCards = document.getElementById("destCards");
    const emptyState = document.getElementById("emptyState");

    if (!destCards) return;

    const data = getDestinations();
    window.TRIPNEST_DATA = data;

    if (regionSelect) {
      const regions = [...new Set(data.map((item) => item.region))].sort();
      regionSelect.innerHTML =
        `<option value="All">All</option>` +
        regions.map((region) => `<option value="${region}">${region}</option>`).join("");
    }

    function cardTemplate(item) {
      const highlights = (item.highlights || []).map((h) => `<li>${h}</li>`).join("");
      const tags = (item.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("");

      return `
        <article class="card">
          <div class="card-body">
            <div class="card-top">
              <h3>${item.name}</h3>
              <span class="badge">${item.budget}</span>
            </div>
            <p class="muted">${item.region}</p>
            <p>${item.blurb}</p>
            <div class="tags">${tags}</div>
            <ul class="feature-list">${highlights}</ul>
          </div>
        </article>
      `;
    }

    function matchesFilters(item) {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const selectedRegion = regionSelect?.value || "All";
      const selectedBudget = budgetSelect?.value || "All";

      const haystack = [item.name, item.region, item.blurb, ...(item.tags || []), ...(item.highlights || [])]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesRegion = selectedRegion === "All" || item.region === selectedRegion;
      const matchesBudget = selectedBudget === "All" || item.budget === selectedBudget;

      return matchesSearch && matchesRegion && matchesBudget;
    }

    function applyRender() {
      const filtered = data.filter(matchesFilters);
      destCards.innerHTML = filtered.map(cardTemplate).join("");
      if (emptyState) emptyState.hidden = filtered.length > 0;
    }

    searchInput?.addEventListener("input", applyRender);
    regionSelect?.addEventListener("change", applyRender);
    budgetSelect?.addEventListener("change", applyRender);

    applyRender();
  }

  function bindPayment() {
    const payBtns = document.querySelectorAll("[data-stripe-price]");
    const payNote = $("#payNote");
    const payStatus = $("#payStatus");
    const flexAmountInput = $("#flexAmount");
    const flexCheckoutBtn = $("#flexCheckoutBtn");

    if (payStatus) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "1") payStatus.textContent = "✅ Payment complete. Thank you!";
      if (params.get("canceled") === "1") payStatus.textContent = "Payment canceled — no worries.";
    }

    async function startCheckout(payload) {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      if (!json?.url) throw new Error("No checkout url returned");
      window.location.href = json.url;
    }

    payBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const priceId = btn.getAttribute("data-stripe-price") || "";
        if (!priceId.startsWith("price_")) {
          if (payNote) payNote.textContent = "Invalid Stripe price ID.";
          return;
        }

        btn.setAttribute("disabled", "true");
        if (payNote) payNote.textContent = "Redirecting to secure checkout…";

        try {
          await startCheckout({ priceId });
        } catch (err) {
          if (payNote) payNote.textContent = `Checkout error: ${String(err?.message || err)}`;
          btn.removeAttribute("disabled");
        }
      });
    });

    if (flexCheckoutBtn && flexAmountInput) {
      flexCheckoutBtn.addEventListener("click", async () => {
        const amount = Number(flexAmountInput.value);

        if (!Number.isFinite(amount) || amount < 0.5) {
          if (payNote) payNote.textContent = "Enter a valid amount of at least $0.50.";
          flexAmountInput.focus();
          return;
        }

        flexCheckoutBtn.setAttribute("disabled", "true");
        if (payNote) payNote.textContent = "Redirecting to secure checkout…";

        try {
          await startCheckout({ amount: Number(amount.toFixed(2)) });
        } catch (err) {
          if (payNote) payNote.textContent = `Checkout error: ${String(err?.message || err)}`;
          flexCheckoutBtn.removeAttribute("disabled");
        }
      });
    }
  }

  function bindAdmin() {
    const adminRoot = document.getElementById("adminRoot");
    if (!adminRoot) return;

    const destinationList = document.getElementById("adminDestinationList");
    const addDestinationForm = document.getElementById("addDestinationForm");
    const mediaList = document.getElementById("adminMediaList");
    const addMediaForm = document.getElementById("addMediaForm");
    const adminNote = document.getElementById("adminNote");

    let destinations = getDestinations();
    let media = getMedia();

    function setNote(text) {
      if (adminNote) adminNote.textContent = text;
    }

    function destinationItemTemplate(item, index) {
      return `
        <article class="admin-item" data-destination-index="${index}">
          <div class="admin-item-grid">
            <label class="field"><span>Name</span><input data-field="name" value="${item.name}" /></label>
            <label class="field"><span>Region</span><input data-field="region" value="${item.region}" /></label>
            <label class="field"><span>Budget</span>
              <select data-field="budget">
                <option value="$" ${item.budget === "$" ? "selected" : ""}>$</option>
                <option value="$$" ${item.budget === "$$" ? "selected" : ""}>$$</option>
                <option value="$$$" ${item.budget === "$$$" ? "selected" : ""}>$$$</option>
              </select>
            </label>
            <label class="field"><span>Image URL</span><input data-field="image" value="${item.image}" /></label>
            <label class="field admin-wide"><span>Blurb</span><textarea data-field="blurb" rows="2">${item.blurb}</textarea></label>
            <label class="field"><span>Tags (comma-separated)</span><input data-field="tags" value="${(item.tags || []).join(", ")}" /></label>
            <label class="field"><span>Highlights (comma-separated)</span><input data-field="highlights" value="${(item.highlights || []).join(", ")}" /></label>
          </div>
          <div class="admin-actions">
            <button type="button" class="btn btn-sm" data-action="edit-destination">Edit</button>
            <button type="button" class="btn btn-sm" data-action="save-destination">Save</button>
            <button type="button" class="btn btn-sm" data-action="delete-destination">Delete</button>
          </div>
        </article>
      `;
    }

    function mediaItemTemplate(path, type, index) {
      return `
        <article class="admin-item" data-media-type="${type}" data-media-index="${index}">
          <div class="admin-media-preview">${type.toUpperCase()}</div>
          <label class="field admin-wide"><span>Path</span><input data-field="path" value="${path}" /></label>
          <div class="admin-actions">
            <button type="button" class="btn btn-sm" data-action="edit-media">Edit</button>
            <button type="button" class="btn btn-sm" data-action="save-media">Save</button>
            <button type="button" class="btn btn-sm" data-action="delete-media">Delete</button>
          </div>
        </article>
      `;
    }

    function refreshDestinationList() {
      destinationList.innerHTML = destinations.map(destinationItemTemplate).join("");
    }

    function refreshMediaList() {
      const photoMarkup = media.photos.map((path, index) => mediaItemTemplate(path, "photo", index));
      const videoMarkup = media.videos.map((path, index) => mediaItemTemplate(path, "video", index));
      mediaList.innerHTML = [...photoMarkup, ...videoMarkup].join("");
    }

    function saveAll() {
      destinations = saveDestinations(destinations);
      media = saveMedia(media);
      refreshDestinationList();
      refreshMediaList();
    }

    destinationList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const item = button.closest("[data-destination-index]");
      if (!item) return;

      const index = Number(item.getAttribute("data-destination-index"));
      const action = button.getAttribute("data-action");

      if (action === "edit-destination") {
        item.classList.add("is-editing");
        setNote(`Editing destination ${index + 1}.`);
        return;
      }

      if (action === "save-destination") {
        const nextDestination = {
          ...destinations[index],
          name: item.querySelector('[data-field="name"]').value.trim(),
          region: item.querySelector('[data-field="region"]').value.trim(),
          budget: item.querySelector('[data-field="budget"]').value,
          image: item.querySelector('[data-field="image"]').value.trim(),
          blurb: item.querySelector('[data-field="blurb"]').value.trim(),
          tags: splitList(item.querySelector('[data-field="tags"]').value),
          highlights: splitList(item.querySelector('[data-field="highlights"]').value)
        };

        destinations[index] = nextDestination;
        saveAll();
        setNote(`Saved destination: ${nextDestination.name}.`);
        return;
      }

      if (action === "delete-destination") {
        const removed = destinations[index];
        destinations.splice(index, 1);
        saveAll();
        setNote(`Deleted destination: ${removed?.name || "Unnamed"}.`);
      }
    });

    addDestinationForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(addDestinationForm);
      const name = String(formData.get("name") || "").trim();

      if (!name) {
        setNote("Destination name is required.");
        return;
      }

      destinations.push({
        id: name.toLowerCase().replace(/\s+/g, "_"),
        name,
        region: String(formData.get("region") || "Other").trim(),
        budget: String(formData.get("budget") || "$$"),
        image: String(formData.get("image") || "assets/img/cancun.jpeg").trim(),
        blurb: String(formData.get("blurb") || "").trim(),
        tags: splitList(formData.get("tags")),
        highlights: splitList(formData.get("highlights"))
      });

      saveAll();
      addDestinationForm.reset();
      setNote(`Added destination: ${name}.`);
    });

    mediaList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const item = button.closest("[data-media-type][data-media-index]");
      if (!item) return;

      const mediaType = item.getAttribute("data-media-type") === "video" ? "videos" : "photos";
      const index = Number(item.getAttribute("data-media-index"));
      const action = button.getAttribute("data-action");

      if (action === "edit-media") {
        item.classList.add("is-editing");
        setNote(`Editing ${mediaType.slice(0, -1)} item.`);
        return;
      }

      if (action === "save-media") {
        const path = item.querySelector('[data-field="path"]').value.trim();
        if (!path) {
          setNote("Media path is required to save.");
          return;
        }

        media[mediaType][index] = path;
        saveAll();
        setNote(`Saved ${mediaType.slice(0, -1)} path.`);
        return;
      }

      if (action === "delete-media") {
        media[mediaType].splice(index, 1);
        saveAll();
        setNote(`Deleted ${mediaType.slice(0, -1)} item.`);
      }
    });

    addMediaForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(addMediaForm);
      const type = formData.get("type") === "video" ? "videos" : "photos";
      const path = String(formData.get("path") || "").trim();

      if (!path) {
        setNote("Media path is required.");
        return;
      }

      media[type].push(path);
      saveAll();
      addMediaForm.reset();
      setNote(`Added ${type.slice(0, -1)} item.`);
    });

    refreshDestinationList();
    refreshMediaList();
  }

  bindNavToggle();
  bindVideoModal();
  renderGallery();
  renderCarousel();
  renderDestinations();
  bindPayment();
  bindAdmin();

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
