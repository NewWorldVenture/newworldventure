(function () {
  const $ = (sel) => document.querySelector(sel);

  const STORAGE_KEYS = {
    destinations: "nwv_destinations",
    mediaImages: "nwv_media_images",
    mediaVideos: "nwv_media_videos",
    authEmail: "nwv_auth_email"
  };
  const ADMIN_EMAIL = "daniel.hughen@gmail.com";

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getDestinations() {
    const defaults = Array.isArray(window.TRIPNEST_DATA) ? window.TRIPNEST_DATA : [];
    return readStorage(STORAGE_KEYS.destinations, defaults);
  }

  function setDestinations(next) {
    writeStorage(STORAGE_KEYS.destinations, next);
    window.TRIPNEST_DATA = next;
  }

  function getImageMedia() {
    return readStorage(STORAGE_KEYS.mediaImages, []);
  }

  function getVideoMedia() {
    return readStorage(STORAGE_KEYS.mediaVideos, []);
  }

  function setImageMedia(next) {
    writeStorage(STORAGE_KEYS.mediaImages, next);
  }

  function setVideoMedia(next) {
    writeStorage(STORAGE_KEYS.mediaVideos, next);
  }

  function getAuthEmail() {
    return (localStorage.getItem(STORAGE_KEYS.authEmail) || "").toLowerCase();
  }

  function setAuthEmail(email) {
    localStorage.setItem(STORAGE_KEYS.authEmail, (email || "").toLowerCase());
  }

  function isAdmin() {
    return getAuthEmail() === ADMIN_EMAIL;
  }

  function csvToList(value) {
    return (value || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function listToCsv(list) {
    return (Array.isArray(list) ? list : []).join(", ");
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });
  }

  function renderAdminNav() {
    const adminNav = document.querySelectorAll(".admin-only");
    adminNav.forEach((el) => {
      el.hidden = !isAdmin();
    });

    const authSlots = document.querySelectorAll("[data-auth-slot]");
    authSlots.forEach((slot) => {
      if (isAdmin()) {
        slot.innerHTML = '<a class="btn btn-ghost" href="admin.html">Admin</a>';
      }
    });
  }

  function setupNavToggle() {
    const nav = $(".nav");
    const navToggle = $(".nav-toggle");
    if (!nav || !navToggle) return;

    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function setupHomeVideoModal() {
    const playBtn = document.getElementById("playVideoBtn");
    const modal = document.getElementById("videoModal");
    const closeBtn = document.getElementById("closeVideo");
    const video = document.getElementById("promoVideo");

    if (!playBtn || !modal || !video || !closeBtn) return;

    function closeModal() {
      modal.style.display = "none";
      video.pause();
      video.currentTime = 0;
    }

    playBtn.addEventListener("click", () => {
      modal.style.display = "flex";
      video.play();
    });

    closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function renderGallery() {
    const galleryGrid = document.getElementById("galleryGrid");
    if (!galleryGrid) return;

    const defaultImages = [
      "atlantic_city.jpeg",
      "bermuda.jpeg",
      "cancun.jpeg",
      "disney.jpeg",
      "dominican.jpeg",
      "greece.jpeg",
      "newyork.jpeg",
      "philly.jpeg"
    ].map((file) => ({ src: `assets/img/${file}`, name: file }));

    const adminImages = getImageMedia();
    const all = [...defaultImages, ...adminImages];

    galleryGrid.innerHTML = all
      .map(
        (img) => `
      <div class="gallery-item">
        <img src="${img.src}" alt="${(img.name || "Travel image").replace(/\.[^/.]+$/, "").replace(/_/g, " ")}" loading="lazy" />
      </div>
    `
      )
      .join("");
  }

  function renderVideosPage() {
    const videosGrid = document.getElementById("videosGrid");
    if (!videosGrid) return;

    const defaultVideos = [{
      name: "Mexico Promo",
      src: "assets/vid/mexico.mp4"
    }];

    const allVideos = [...defaultVideos, ...getVideoMedia()];

    videosGrid.innerHTML = allVideos
      .map(
        (video) => `
      <article class="card">
        <div class="card-body">
          <h3>${video.name || "Travel Video"}</h3>
          <video controls preload="metadata" class="uploaded-video">
            <source src="${video.src}" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </article>
    `
      )
      .join("");
  }

  function renderCarousel() {
    const viewport = document.getElementById("carViewport");
    const prevBtn = document.getElementById("carPrev");
    const nextBtn = document.getElementById("carNext");
    const data = getDestinations();

    if (!viewport || !Array.isArray(data) || !data.length) return;

    let currentIndex = 0;
    let autoRotate;

    function renderSlide(index) {
      const item = data[index];
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
      currentIndex = (currentIndex + 1) % data.length;
      renderSlide(currentIndex);
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + data.length) % data.length;
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

    if (regionSelect) {
      const regions = [...new Set(data.map((item) => item.region))].sort();
      regionSelect.innerHTML = '<option value="All">All</option>' +
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

      const haystack = [item.name, item.region, item.blurb, ...(item.tags || []), ...(item.highlights || [])].join(" ").toLowerCase();

      return (!q || haystack.includes(q)) &&
        (selectedRegion === "All" || item.region === selectedRegion) &&
        (selectedBudget === "All" || item.budget === selectedBudget);
    }

    function paint() {
      const filtered = data.filter(matchesFilters);
      destCards.innerHTML = filtered.map(cardTemplate).join("");
      if (emptyState) emptyState.hidden = filtered.length > 0;
    }

    searchInput?.addEventListener("input", paint);
    regionSelect?.addEventListener("change", paint);
    budgetSelect?.addEventListener("change", paint);
    paint();
  }

  function setupLoginPage() {
    const authForm = document.getElementById("googleAuthForm");
    const loginNote = document.getElementById("loginNote");
    const currentStatus = document.getElementById("currentAuthStatus");
    const signOutBtn = document.getElementById("signOutBtn");
    if (!authForm) return;

    if (currentStatus) {
      currentStatus.textContent = isAdmin()
        ? "Signed in as admin (Daniel.Hughen@gmail.com)."
        : getAuthEmail()
          ? `Signed in as ${getAuthEmail()}. Admin access is disabled.`
          : "Not currently signed in.";
    }

    authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(authForm);
      const email = String(formData.get("googleEmail") || "").trim().toLowerCase();

      if (!email) {
        if (loginNote) loginNote.textContent = "Enter the Google email used during sign-in.";
        return;
      }

      setAuthEmail(email);
      if (email === ADMIN_EMAIL) {
        if (loginNote) loginNote.textContent = "Admin login verified. Redirecting to Admin page...";
        window.setTimeout(() => {
          window.location.href = "admin.html";
        }, 500);
      } else {
        if (loginNote) loginNote.textContent = "Login saved, but this account does not have admin permissions.";
      }
    });

    signOutBtn?.addEventListener("click", () => {
      setAuthEmail("");
      window.location.reload();
    });
  }

  function setupAdminPage() {
    const adminForm = document.getElementById("destinationAdminForm");
    if (!adminForm) return;

    if (!isAdmin()) {
      window.location.href = "login.html";
      return;
    }

    const selector = document.getElementById("destinationSelector");
    const saveNote = document.getElementById("adminSaveNote");

    function fillSelector() {
      const data = getDestinations();
      selector.innerHTML = '<option value="__new__">+ Create new destination</option>' +
        data.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
    }

    function fillFormFor(id) {
      adminForm.reset();
      if (id === "__new__") return;
      const item = getDestinations().find((d) => d.id === id);
      if (!item) return;

      adminForm.elements.id.value = item.id || "";
      adminForm.elements.name.value = item.name || "";
      adminForm.elements.region.value = item.region || "";
      adminForm.elements.budget.value = item.budget || "$$";
      adminForm.elements.image.value = item.image || "";
      adminForm.elements.blurb.value = item.blurb || "";
      adminForm.elements.highlights.value = listToCsv(item.highlights);
      adminForm.elements.tags.value = listToCsv(item.tags);
      adminForm.elements.sampleDays.value = listToCsv(item.sampleDays);
    }

    selector.addEventListener("change", () => fillFormFor(selector.value));

    adminForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(adminForm);
      const data = getDestinations();

      const record = {
        id: String(formData.get("id") || "").trim().toLowerCase().replace(/\s+/g, "_"),
        name: String(formData.get("name") || "").trim(),
        region: String(formData.get("region") || "").trim(),
        budget: String(formData.get("budget") || "$$").trim(),
        image: String(formData.get("image") || "").trim(),
        blurb: String(formData.get("blurb") || "").trim(),
        highlights: csvToList(String(formData.get("highlights") || "")),
        tags: csvToList(String(formData.get("tags") || "")),
        sampleDays: csvToList(String(formData.get("sampleDays") || ""))
      };

      if (!record.id || !record.name || !record.region || !record.image) {
        if (saveNote) saveNote.textContent = "ID, name, region, and image are required.";
        return;
      }

      const existingIndex = data.findIndex((item) => item.id === record.id);
      if (existingIndex >= 0) {
        data[existingIndex] = record;
      } else {
        data.push(record);
      }

      setDestinations(data);
      fillSelector();
      selector.value = record.id;
      if (saveNote) saveNote.textContent = "Destination saved successfully.";
    });

    const imageUploadForm = document.getElementById("adminImageUploadForm");
    const videoUploadForm = document.getElementById("adminVideoUploadForm");
    const mediaNote = document.getElementById("adminMediaNote");

    imageUploadForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = document.getElementById("adminImageFile");
      const file = fileInput?.files?.[0];
      if (!file) {
        if (mediaNote) mediaNote.textContent = "Select an image file first.";
        return;
      }

      const dataUrl = await fileToDataUrl(file);
      const images = getImageMedia();
      images.push({ name: file.name, src: dataUrl });
      setImageMedia(images);
      if (mediaNote) mediaNote.textContent = `${file.name} uploaded to Gallery successfully.`;
      imageUploadForm.reset();
    });

    videoUploadForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = document.getElementById("adminVideoFile");
      const file = fileInput?.files?.[0];
      if (!file) {
        if (mediaNote) mediaNote.textContent = "Select a video file first.";
        return;
      }

      const dataUrl = await fileToDataUrl(file);
      const videos = getVideoMedia();
      videos.push({ name: file.name, src: dataUrl });
      setVideoMedia(videos);
      if (mediaNote) mediaNote.textContent = `${file.name} uploaded to Videos successfully.`;
      videoUploadForm.reset();
    });

    fillSelector();
    fillFormFor("__new__");
  }

  function setupStripe() {
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

  function init() {
    window.TRIPNEST_DATA = getDestinations();
    renderAdminNav();
    setupNavToggle();
    setupHomeVideoModal();
    renderGallery();
    renderVideosPage();
    renderCarousel();
    renderDestinations();
    setupLoginPage();
    setupAdminPage();
    setupStripe();

    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  init();
})();
