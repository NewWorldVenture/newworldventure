(function () {
  const $ = (sel) => document.querySelector(sel);

  const AUTH_STORAGE_KEY = "nwv_auth_user";
  const MEDIA_STORAGE_KEY = "nwv_uploaded_media";
  const ADMIN_EMAIL = "daniel.hughen@gmail.com";

  function safeJSONParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getCurrentUser() {
    return safeJSONParse(localStorage.getItem(AUTH_STORAGE_KEY), null);
  }

  function setCurrentUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isAdminUser(user) {
    return normalizeEmail(user?.email) === ADMIN_EMAIL;
  }

  function getUploadedMedia() {
    return safeJSONParse(localStorage.getItem(MEDIA_STORAGE_KEY), []);
  }

  function setUploadedMedia(mediaList) {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(mediaList));
  }

  function decodeJwt(token) {
    if (!token || token.split(".").length < 2) return null;

    try {
      const payload = token.split(".")[1];
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
      const decoded = atob(normalized + pad);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  function refreshAuthUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById("loginBtn");
    const adminLinks = document.querySelectorAll("[data-admin-link]");
    const userGreeting = document.getElementById("userGreeting");

    adminLinks.forEach((link) => {
      link.classList.toggle("is-hidden", !isAdminUser(user));
    });

    if (loginBtn) {
      if (user?.email) {
        loginBtn.textContent = "Logout";
        loginBtn.setAttribute("href", "#");
        loginBtn.onclick = (event) => {
          event.preventDefault();
          clearCurrentUser();
          window.location.reload();
        };
      } else {
        loginBtn.textContent = "Login";
        loginBtn.setAttribute("href", "login.html");
        loginBtn.onclick = null;
      }
    }

    if (userGreeting) {
      userGreeting.textContent = user?.email ? `Signed in as ${user.email}` : "Not signed in.";
    }
  }

  function initGoogleLogin() {
    const googleSignInTarget = document.getElementById("googleSignInBtn");
    if (!googleSignInTarget) return;

    const clientId = googleSignInTarget.dataset.googleClientId || "";
    const loginStatus = document.getElementById("loginStatus");

    if (!window.google?.accounts?.id) {
      if (loginStatus) {
        loginStatus.textContent = "Google Sign-In script not loaded. Please refresh.";
      }
      return;
    }

    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      if (loginStatus) {
        loginStatus.textContent = "Set a valid Google Client ID in login.html before using login.";
      }
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        const payload = decodeJwt(response?.credential);

        if (!payload?.email) {
          if (loginStatus) loginStatus.textContent = "Unable to read Google account email.";
          return;
        }

        const user = {
          email: normalizeEmail(payload.email),
          name: payload.name || "",
          picture: payload.picture || "",
          provider: "google"
        };

        setCurrentUser(user);
        window.location.href = "index.html";
      }
    });

    window.google.accounts.id.renderButton(googleSignInTarget, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 260
    });
  }

  async function fileToDataUrl(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read selected file."));
      reader.readAsDataURL(file);
    });
  }

  function initAdminPage() {
    const adminPanel = document.getElementById("adminPanel");
    if (!adminPanel) return;

    const user = getCurrentUser();
    const noAccess = document.getElementById("adminNoAccess");
    const adminUploadForm = document.getElementById("adminUploadForm");
    const adminFileInput = document.getElementById("adminFile");
    const adminTitleInput = document.getElementById("adminTitle");
    const adminUploadStatus = document.getElementById("adminUploadStatus");
    const adminMediaList = document.getElementById("adminMediaList");

    function renderAdminUploads() {
      const uploads = getUploadedMedia();

      if (!adminMediaList) return;
      if (!uploads.length) {
        adminMediaList.innerHTML = `<p class="muted">No uploads yet.</p>`;
        return;
      }

      adminMediaList.innerHTML = uploads
        .slice()
        .reverse()
        .map((item) => `
          <article class="admin-item">
            <strong>${item.title}</strong>
            <span class="muted small">${item.type.toUpperCase()} • ${new Date(item.uploadedAt).toLocaleString()}</span>
          </article>
        `)
        .join("");
    }

    if (!isAdminUser(user)) {
      adminPanel.classList.add("is-hidden");
      if (noAccess) noAccess.classList.remove("is-hidden");
      return;
    }

    if (noAccess) noAccess.classList.add("is-hidden");
    adminPanel.classList.remove("is-hidden");
    renderAdminUploads();

    adminUploadForm?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const file = adminFileInput?.files?.[0];
      const title = String(adminTitleInput?.value || "").trim();

      if (!file) {
        if (adminUploadStatus) adminUploadStatus.textContent = "Please choose an image or video file.";
        return;
      }

      const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "";
      if (!mediaType) {
        if (adminUploadStatus) adminUploadStatus.textContent = "Only image or video uploads are allowed.";
        return;
      }

      try {
        if (adminUploadStatus) adminUploadStatus.textContent = "Uploading…";
        const src = await fileToDataUrl(file);
        const uploads = getUploadedMedia();

        uploads.push({
          id: `upload-${Date.now()}`,
          title: title || file.name,
          type: mediaType,
          src,
          uploadedAt: new Date().toISOString()
        });

        setUploadedMedia(uploads);
        adminUploadForm.reset();
        if (adminUploadStatus) adminUploadStatus.textContent = "Upload complete.";
        renderAdminUploads();
      } catch (error) {
        if (adminUploadStatus) adminUploadStatus.textContent = String(error?.message || error);
      }
    });
  }

  function initGalleryPage() {
    const galleryGrid = document.getElementById("galleryGrid");
    if (!galleryGrid) return;

    const images = [
      "atlantic_city.jpeg",
      "bermuda.jpeg",
      "cancun.jpeg",
      "disney.jpeg",
      "dominican.jpeg",
      "greece.jpeg",
      "newyork.jpeg",
      "philly.jpeg"
    ];

    const defaultImageCards = images.map((img) => ({
      src: `assets/img/${img}`,
      alt: img.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
    }));

    const uploadedImageCards = getUploadedMedia()
      .filter((item) => item.type === "image")
      .map((item) => ({ src: item.src, alt: item.title }));

    const cards = [...defaultImageCards, ...uploadedImageCards];

    galleryGrid.innerHTML = cards
      .map(
        (item) => `
      <div class="gallery-item">
        <img
          src="${item.src}"
          alt="${item.alt}"
          loading="lazy"
        />
      </div>
    `
      )
      .join("");
  }

  function initVideosPage() {
    const videoGrid = document.getElementById("videoGrid");
    if (!videoGrid) return;

    const defaultVideos = [
      {
        title: "Mexico Highlights",
        src: "assets/vid/mexico.mp4"
      }
    ];

    const uploadedVideos = getUploadedMedia()
      .filter((item) => item.type === "video")
      .map((item) => ({ title: item.title, src: item.src }));

    const videos = [...defaultVideos, ...uploadedVideos];

    videoGrid.innerHTML = videos
      .map(
        (item) => `
      <article class="video-item">
        <video controls preload="metadata">
          <source src="${item.src}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <h3>${item.title}</h3>
      </article>
    `
      )
      .join("");
  }

  const payBtns = document.querySelectorAll("[data-stripe-price]");
  const payNote = $("#payNote");
  const payStatus = $("#payStatus");
  const flexAmountInput = $("#flexAmount");
  const flexCheckoutBtn = $("#flexCheckoutBtn");
  const yearEl = $("#year");

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

  refreshAuthUI();
  initGoogleLogin();
  initGalleryPage();
  initVideosPage();
  initAdminPage();
})();
