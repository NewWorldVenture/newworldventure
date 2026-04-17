(function () {
  const $ = (sel) => document.querySelector(sel);

  const payBtns = document.querySelectorAll("[data-stripe-price]");
  const payNote = $("#payNote");
  const payStatus = $("#payStatus");
  const flexAmountInput = $("#flexAmount");
  const flexCheckoutBtn = $("#flexCheckoutBtn");
  const yearEl = $("#year");

  const galleryGrid = document.getElementById("galleryGrid");
  if (galleryGrid) {
    const images = [
      "atlantic_city.jpeg",
      "bermuda.jpeg",
      "cancun.svg",
      "disney.jpeg",
      "dominican.svg",
      "greece.jpeg",
      "newyork.jpeg",
      "philly.jpeg"
    ];

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
          <img class="card-image" src="${item.image}" alt="${item.name}" loading="lazy" />
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
})();
