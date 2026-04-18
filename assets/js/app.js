(function () {
  const $ = (sel) => document.querySelector(sel);
  const AUTH_KEY = "nwv_admin_auth";
  const ADMIN_EMAIL = "Daniel.Hughen@gmail.com";

  const payBtns = document.querySelectorAll("[data-stripe-price]");
  const payNote = $("#payNote");
  const payStatus = $("#payStatus");
  const flexAmountInput = $("#flexAmount");
  const flexCheckoutBtn = $("#flexCheckoutBtn");
  const yearEl = $("#year");

  function isAdminAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === "1";
  }

  function setAdminAuthenticated(state) {
    localStorage.setItem(AUTH_KEY, state ? "1" : "0");
  }

  function getCurrentPage() {
    const path = window.location.pathname.split("/").pop();
    return path || "index.html";
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(atob(base64).split("").map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join("")));
    } catch {
      return null;
    }
  }

  function appendNavLink(nav, href, label, type, activeWhen) {
    const existing = nav.querySelector(`a[href='${href}']`);
    if (existing) {
      existing.dataset.navType = type;
      if (activeWhen === href) existing.classList.add("active");
      return existing;
    }

    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = href;
    link.textContent = label;
    link.dataset.navType = type;
    if (activeWhen === href) link.classList.add("active");
    nav.appendChild(link);
    return link;
  }

  function ensureGoogleScript() {
    if (window.google?.accounts?.id) return;
    if (document.querySelector("script[data-google-signin='1']")) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleSignin = "1";
    document.head.appendChild(script);
  }

  function updateAuthUI() {
    const authenticated = isAdminAuthenticated();
    document.body.classList.toggle("admin-authenticated", authenticated);

    document.querySelectorAll(".nav .nav-link").forEach((link) => {
      if (!link.dataset.navType) {
        const href = link.getAttribute("href") || "";
        link.dataset.navType = href.includes("admin.html") ? "admin" : "public";
      }
    });

    document.querySelectorAll("[data-nav-type='public'], [data-nav-type='admin']").forEach((el) => {
      const type = el.dataset.navType;
      const show = authenticated ? type === "admin" : type === "public";
      el.classList.toggle("auth-hidden", !show);
    });

    document.querySelectorAll(".auth-btn").forEach((btn) => {
      btn.textContent = authenticated ? "Logout" : "Login";
      btn.setAttribute("aria-label", authenticated ? "Logout" : "Login");
    });

    const page = getCurrentPage();
    if (authenticated && page !== "admin.html") {
      window.location.href = "admin.html";
      return;
    }

    if (!authenticated && page === "admin.html") {
      const adminGate = document.getElementById("adminGate");
      const adminContent = document.getElementById("adminContent");
      if (adminGate) adminGate.hidden = false;
      if (adminContent) adminContent.hidden = true;
    }
  }

  function buildGlobalNav() {
    const nav = document.querySelector(".nav[aria-label='Primary']");
    const headerInner = document.querySelector(".header-inner, .glass-inner");
    if (!nav || !headerInner) return;

    const page = getCurrentPage();
    nav.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.dataset.navType = href.includes("admin.html") ? "admin" : "public";
      if (href === page) link.classList.add("active");
    });

    appendNavLink(nav, "videos.html", "Videos", "public", page);
    appendNavLink(nav, "admin.html", "Admin", "admin", page);

    let authBtn = headerInner.querySelector("#globalAuthBtn");
    if (!authBtn) {
      authBtn = document.createElement("button");
      authBtn.id = "globalAuthBtn";
      authBtn.className = "btn btn-ghost auth-btn";
      authBtn.type = "button";
      headerInner.insertBefore(authBtn, headerInner.querySelector(".nav-toggle") || null);
    }

    authBtn.addEventListener("click", () => {
      if (isAdminAuthenticated()) {
        setAdminAuthenticated(false);
        updateAuthUI();
        if (getCurrentPage() === "admin.html") {
          window.location.href = "index.html";
        }
        return;
      }

      ensureGoogleScript();
      const attemptLogin = () => {
        if (!window.google?.accounts?.id) {
          window.setTimeout(attemptLogin, 200);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: (response) => {
            const payload = parseJwt(response.credential || "");
            if (payload?.email && payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
              setAdminAuthenticated(true);
              updateAuthUI();
              window.location.href = "admin.html";
            } else {
              alert("Access denied.");
            }
          }
        });

        window.google.accounts.id.prompt();
      };

      attemptLogin();
    });
  }

  function initVideosPage() {
    const videosGrid = document.getElementById("videosGrid");
    if (!videosGrid || !Array.isArray(window.TRIPNEST_VIDEOS)) return;

    videosGrid.innerHTML = window.TRIPNEST_VIDEOS.map((video) => `
      <article class="video-card">
        <video controls preload="metadata" poster="${video.poster}">
          <source src="${video.src}" type="video/mp4" />
        </video>
        <div class="video-meta">
          <h3>${video.title}</h3>
          <p class="muted">${video.description}</p>
        </div>
      </article>
    `).join("");
  }

  function initAdminPage() {
    const tabs = document.querySelectorAll(".admin-tab");
    const panels = document.querySelectorAll(".admin-panel");
    const gate = document.getElementById("adminGate");
    const content = document.getElementById("adminContent");
    if (!tabs.length || !panels.length || !gate || !content) return;

    if (!isAdminAuthenticated()) {
      gate.hidden = false;
      content.hidden = true;
      return;
    }

    gate.hidden = true;
    content.hidden = false;

    const destBody = document.getElementById("adminDestinationsBody");
    if (destBody && Array.isArray(window.TRIPNEST_DATA)) {
      destBody.innerHTML = window.TRIPNEST_DATA.map((item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.region}</td>
          <td>${item.budget}</td>
          <td>${(item.tags || []).join(", ")}</td>
        </tr>
      `).join("");
    }

    const photoBody = document.getElementById("adminPhotosBody");
    if (photoBody && Array.isArray(window.TRIPNEST_PHOTOS)) {
      photoBody.innerHTML = window.TRIPNEST_PHOTOS.map((photo) => `
        <tr>
          <td>${photo.title}</td>
          <td>${photo.file}</td>
          <td>${photo.category}</td>
        </tr>
      `).join("");
    }

    const videoBody = document.getElementById("adminVideosBody");
    if (videoBody && Array.isArray(window.TRIPNEST_VIDEOS)) {
      videoBody.innerHTML = window.TRIPNEST_VIDEOS.map((video) => `
        <tr>
          <td>${video.title}</td>
          <td>${video.src}</td>
          <td>${video.description}</td>
        </tr>
      `).join("");
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        panels.forEach((panel) => panel.hidden = panel.dataset.panel !== target);
      });
    });
  }

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

  const galleryGrid = document.getElementById("galleryGrid");
  if (galleryGrid) {
    const images = (window.TRIPNEST_PHOTOS || []).map((photo) => photo.file);

    galleryGrid.innerHTML = images.map((img) => `
      <div class="gallery-item">
        <img
          src="assets/img/${img}"
          alt="${img.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}"
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

  buildGlobalNav();
  updateAuthUI();
  initVideosPage();
  initAdminPage();
})();
