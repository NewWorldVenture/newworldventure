(function () {
  const $ = (sel) => document.querySelector(sel);

  const payBtns = document.querySelectorAll("[data-stripe-price]");
  const payNote = $("#payNote");
  const payStatus = $("#payStatus");
  const flexAmountInput = $("#flexAmount");
  const flexCheckoutBtn = $("#flexCheckoutBtn");
  const yearEl = $("#year");

	const galleryGrid = document.getElementById("galleryGrid");
const galleryNote = document.getElementById("galleryNote");

if (galleryGrid) {
  const images = [
    "atlantic-city.jpg",
    "bermuda.jpg",
    "cancun.jpg",
    "disney.jpg",
    "dominican.jpg",
    "greece.jpeg",
    "new-york.jpg",
    "philly.jpg"
  ];

  galleryGrid.innerHTML = images.map((img) => `
    <div class="gallery-item">
      <img src="assets/img/${img}" alt="${img.replace(/\.[^/.]+$/, "").replace(/-/g, " ")}" loading="lazy" />
    </div>
  `).join("");

  if (galleryNote) {
    galleryNote.textContent = `${images.length} photos loaded from assets/img`;
  }
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
        <div class="car-image" style="background-image: url('${item.image}'); background-size: cover; background-position: center;">
        </div>
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
    autoRotate = setInterval(showNext, 3000); // rotates every 3 seconds
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