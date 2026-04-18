(function () {
  const $ = (sel) => document.querySelector(sel);

  const payBtns = document.querySelectorAll("[data-stripe-price]");
  const payNote = $("#payNote");
  const payStatus = $("#payStatus");
  const flexAmountInput = $("#flexAmount");
  const flexCheckoutBtn = $("#flexCheckoutBtn");
  const yearEl = $("#year");

  const ADMIN_EMAIL = "Daniel.Hughen@gmail.com";
  const ADMIN_AUTH_KEY = "nwv_admin_logged_in";
  const PHOTOS_KEY = "nwv_admin_photos";
  const VIDEOS_KEY = "nwv_admin_videos";

  const playBtn = document.getElementById("playVideoBtn");
  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("closeVideo");
  const video = document.getElementById("promoVideo");

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

  function isAdminLoggedIn() {
    return localStorage.getItem(ADMIN_AUTH_KEY) === "1";
  }

  function setAdminLoggedIn(value) {
    if (value) {
      localStorage.setItem(ADMIN_AUTH_KEY, "1");
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  }

  function wireBannerAuthButton() {
    const btn = document.getElementById("bannerAuthBtn");
    if (!btn) return;

    const refresh = () => {
      const loggedIn = isAdminLoggedIn();
      btn.textContent = loggedIn ? "Logout" : "Login";
      btn.setAttribute("href", loggedIn ? "#" : "login.html");
    };

    btn.addEventListener("click", (e) => {
      if (isAdminLoggedIn()) {
        e.preventDefault();
        setAdminLoggedIn(false);
        refresh();
        if (window.location.pathname.endsWith("admin.html")) {
          window.location.href = "login.html";
        }
      }
    });

    refresh();
  }

  function getDefaultPhotos() {
    return [
      { title: "Atlantic City", file: "assets/img/atlantic_city.jpeg" },
      { title: "Bermuda", file: "assets/img/bermuda.jpeg" },
      { title: "Cancun", file: "assets/img/cancun.jpeg" }
    ];
  }

  function getDefaultVideos() {
    return [
      { title: "Mexico Trip", file: "assets/vid/mexico.mp4" },
      { title: "Resort Preview", file: "assets/vid/Mexico.mp4" }
    ];
  }

  function getEditableList(key, defaults) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Invalid");
      return parsed;
    } catch {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
  }

  function saveEditableList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function setupLogin() {
    const loginForm = document.getElementById("adminLoginForm");
    if (!loginForm) return;

    const emailEl = document.getElementById("adminEmail");
    const note = document.getElementById("loginNote");

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const entered = (emailEl?.value || "").trim().toLowerCase();

      if (entered === ADMIN_EMAIL.toLowerCase()) {
        setAdminLoggedIn(true);
        if (note) note.textContent = "Login successful. Redirecting to Admin...";
        window.setTimeout(() => {
          window.location.href = "admin.html";
        }, 300);
      } else if (note) {
        setAdminLoggedIn(false);
        note.textContent = "Access denied. Please use an authorized admin account.";
      }
    });
  }

  function setupAdminEditors() {
    const photosBody = document.getElementById("photosTableBody");
    const videosBody = document.getElementById("videosTableBody");
    if (!photosBody || !videosBody) return;

    if (!isAdminLoggedIn()) {
      window.location.href = "login.html";
      return;
    }

    let photos = getEditableList(PHOTOS_KEY, getDefaultPhotos());
    let videos = getEditableList(VIDEOS_KEY, getDefaultVideos());

    const photoTitle = document.getElementById("photoTitle");
    const photoFile = document.getElementById("photoFile");
    const photoIndex = document.getElementById("photoEditIndex");
    const photoForm = document.getElementById("photoEditForm");

    const videoTitle = document.getElementById("videoTitle");
    const videoFile = document.getElementById("videoFile");
    const videoIndex = document.getElementById("videoEditIndex");
    const videoForm = document.getElementById("videoEditForm");

    const adminNote = document.getElementById("adminNote");

    function renderRows() {
      photosBody.innerHTML = photos
        .map((item, idx) => `
          <tr>
            <td>${item.title}</td>
            <td><code>${item.file}</code></td>
            <td><button type="button" class="btn btn-ghost admin-edit-photo" data-index="${idx}">Edit</button></td>
          </tr>
        `)
        .join("");

      videosBody.innerHTML = videos
        .map((item, idx) => `
          <tr>
            <td>${item.title}</td>
            <td><code>${item.file}</code></td>
            <td><button type="button" class="btn btn-ghost admin-edit-video" data-index="${idx}">Edit</button></td>
          </tr>
        `)
        .join("");
    }

    photosBody.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(".admin-edit-photo")) return;

      const idx = Number(target.getAttribute("data-index"));
      const item = photos[idx];
      if (!item) return;
      photoIndex.value = String(idx);
      photoTitle.value = item.title;
      photoFile.value = item.file;
    });

    videosBody.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(".admin-edit-video")) return;

      const idx = Number(target.getAttribute("data-index"));
      const item = videos[idx];
      if (!item) return;
      videoIndex.value = String(idx);
      videoTitle.value = item.title;
      videoFile.value = item.file;
    });

    photoForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const idx = Number(photoIndex?.value);
      if (!Number.isInteger(idx) || idx < 0 || idx >= photos.length) return;
      photos[idx] = { title: photoTitle.value.trim(), file: photoFile.value.trim() };
      saveEditableList(PHOTOS_KEY, photos);
      renderRows();
      if (adminNote) adminNote.textContent = "Photo updated successfully.";
    });

    videoForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const idx = Number(videoIndex?.value);
      if (!Number.isInteger(idx) || idx < 0 || idx >= videos.length) return;
      videos[idx] = { title: videoTitle.value.trim(), file: videoFile.value.trim() };
      saveEditableList(VIDEOS_KEY, videos);
      renderRows();
      if (adminNote) adminNote.textContent = "Video updated successfully.";
    });

    renderRows();
  }

  function setupVideosPage() {
    const videoCards = document.getElementById("videoCards");
    if (!videoCards) return;

    const videos = getEditableList(VIDEOS_KEY, getDefaultVideos());
    videoCards.innerHTML = videos.map((item) => `
      <article class="card">
        <div class="card-body">
          <h3>${item.title}</h3>
          <video controls width="100%">
            <source src="${item.file}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </article>
    `).join("");
  }

  const galleryGrid = document.getElementById("galleryGrid");
  if (galleryGrid) {
    const images = getEditableList(PHOTOS_KEY, getDefaultPhotos());

    galleryGrid.innerHTML = images.map((img) => `
      <div class="gallery-item">
        <img
          src="${img.file}"
          alt="${img.title}"
          loading="lazy"
        />
      </div>
    `).join("");
  }

  const viewport = document.getElementById("carViewport");
  const prevBtn = document.getElementById("carPrev");
  const nextBtn = document.getElementById("carNext");

  if (viewport && Array.isArray(window.TRIPNEST_DATA) && window.TRIPNEST_DATA.length) {
    let currentIndex = 0;
    let autoRotate;

    function renderSlide(index) {
      const item = window.TRIPNEST_DATA[index];

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
      currentIndex = (currentIndex + 1) % window.TRIPNEST_DATA.length;
      renderSlide(currentIndex);
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + window.TRIPNEST_DATA.length) % window.TRIPNEST_DATA.length;
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

  const searchInput = document.getElementById("searchInput");
  const regionSelect = document.getElementById("regionSelect");
  const budgetSelect = document.getElementById("budgetSelect");
  const destCards = document.getElementById("destCards");
  const emptyState = document.getElementById("emptyState");

  if (destCards && Array.isArray(window.TRIPNEST_DATA)) {
    const data = window.TRIPNEST_DATA;

    if (regionSelect) {
      const regions = [...new Set(data.map((item) => item.region))].sort();
      regionSelect.innerHTML = `<option value="All">All</option>` +
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

      const haystack = [
        item.name,
        item.region,
        item.blurb,
        ...(item.tags || []),
        ...(item.highlights || [])
      ].join(" ").toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesRegion = selectedRegion === "All" || item.region === selectedRegion;
      const matchesBudget = selectedBudget === "All" || item.budget === selectedBudget;

      return matchesSearch && matchesRegion && matchesBudget;
    }

    function renderDestinations() {
      const filtered = data.filter(matchesFilters);

      destCards.innerHTML = filtered.map(cardTemplate).join("");
      if (emptyState) emptyState.hidden = filtered.length > 0;
    }

    searchInput?.addEventListener("input", renderDestinations);
    regionSelect?.addEventListener("change", renderDestinations);
    budgetSelect?.addEventListener("change", renderDestinations);

    renderDestinations();
  }

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  wireBannerAuthButton();
  setupLogin();
  setupAdminEditors();
  setupVideosPage();
})();
