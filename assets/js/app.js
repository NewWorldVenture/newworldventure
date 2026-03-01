(function () {
  const $ = (sel) => document.querySelector(sel);

  
  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  // Mobile menu (works for both header styles)
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const clickedInside = nav.contains(target) || toggle.contains(target);
      if (!clickedInside) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Helpers
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const data = window.TRIPNEST_DATA || [];

  /* ---------------- Home: glass carousel ---------------- */
  const viewport = $("#carViewport");
  const prevBtn = $("#carPrev");
  const nextBtn = $("#carNext");

  if (viewport && data.length) {
    let i = 0;
    const featured = data.slice(0, 5);

    function slideHTML(d) {
      // Note: image area is a stylized gradient. Swap to real photos later.
      return `
        <div class="car-slide" role="group" aria-label="Featured destination">
          <div class="car-image" aria-hidden="true"></div>
          <div class="car-meta">
            <div>
              <div class="car-place">${escapeHtml(d.name)}</div>
              <div class="car-loc">The Location Name • ${escapeHtml(d.region)}</div>
            </div>
            <div class="car-chip">${escapeHtml(d.budget)}</div>
          </div>
        </div>
      `;
    }

    function render() {
      const d = featured[i % featured.length];
      viewport.innerHTML = slideHTML(d);
    }

    function go(delta) {
      i = (i + delta + featured.length) % featured.length;
      render();
    }

    render();

    prevBtn?.addEventListener("click", () => go(-1));
    nextBtn?.addEventListener("click", () => go(1));

    // Gentle auto-advance (pause on hover)
    let timer = setInterval(() => go(1), 4500);
    viewport.addEventListener("mouseenter", () => clearInterval(timer));
    viewport.addEventListener("mouseleave", () => (timer = setInterval(() => go(1), 4500)));
  }

  /* ---------------- Home: modal video placeholder ---------------- */
  const playBtn = $("#playVideoBtn");
  const modal = $("#videoModal");
  if (playBtn && modal) {
    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    };
    const open = () => {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    };

    playBtn.addEventListener("click", open);
    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-close") === "1") close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ---------------- Destinations page: search + filters ---------------- */
  const destCards = $("#destCards");
  if (destCards) {
    const searchInput = $("#searchInput");
    const regionSelect = $("#regionSelect");
    const budgetSelect = $("#budgetSelect");
    const emptyState = $("#emptyState");

    const regions = Array.from(new Set(data.map(d => d.region))).sort();
    regionSelect.innerHTML = ['<option value="All">All</option>', ...regions.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`)].join("");

    function matches(d, q, region, budget) {
      const hay = (d.name + " " + d.region + " " + d.budget + " " + (d.tags||[]).join(" ") + " " + (d.highlights||[]).join(" ")).toLowerCase();
      const okQ = !q || hay.includes(q);
      const okR = region === "All" || d.region === region;
      const okB = budget === "All" || d.budget === budget;
      return okQ && okR && okB;
    }

    function cardHTML(dest) {
      const tags = (dest.tags || []).slice(0, 4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      const highlights = (dest.highlights || []).slice(0, 3).map(h => `<span class="badge">• ${escapeHtml(h)}</span>`).join("<br/>");

      return `
        <article class="card">
          <div class="card-top">
            <div class="badge">🌍 ${escapeHtml(dest.region)} &nbsp;|&nbsp; 💰 ${escapeHtml(dest.budget)}</div>
          </div>
          <div class="card-body">
            <h3>${escapeHtml(dest.name)}</h3>
            <p class="muted">${escapeHtml(dest.blurb)}</p>
            <div class="muted small" style="margin-top:.6rem">${highlights}</div>
            <div class="tagrow">${tags}</div>
          </div>
        </article>
      `;
    }

    function render() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const region = regionSelect?.value || "All";
      const budget = budgetSelect?.value || "All";

      const filtered = data.filter(d => matches(d, q, region, budget));
      destCards.innerHTML = filtered.map(cardHTML).join("");
      if (emptyState) emptyState.hidden = filtered.length !== 0;
    }

    render();
    [searchInput, regionSelect, budgetSelect].forEach(el => {
      if (!el) return;
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
  }

  /* ---------------- Contact form (front-end only) ---------------- */
  const contactForm = $("#contactForm");
  const contactNote = $("#contactNote");
  if (contactForm && contactNote) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      contactNote.textContent = "✅ Thanks! Your message was captured (demo).";
      contactForm.reset();
      setTimeout(() => (contactNote.textContent = ""), 4500);
    });
  }

  /* ---------------- Gallery page (localStorage) ---------------- */
  const galleryGrid = $("#galleryGrid");
  const addPhotoForm = $("#addPhotoForm");
  const galleryNote = $("#galleryNote");
  const GALLERY_KEY = "tripnest_gallery_v1";
  const loadGallery = () => {
    try {
      return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const saveGallery = (items) => localStorage.setItem(GALLERY_KEY, JSON.stringify(items));

  function galleryItemHTML(it, idx) {
    return `
      <figure class="g-item">
        <img src="${it.src}" alt="${escapeHtml(it.caption || "Photo")}" loading="lazy" />
        <figcaption>
          <div class="g-cap">${escapeHtml(it.caption || "")}</div>
          <button class="btn btn-ghost btn-sm" data-del="${idx}" type="button">Remove</button>
        </figcaption>
      </figure>
    `;
  }

  function renderGallery() {
    if (!galleryGrid) return;
    const items = loadGallery();
    galleryGrid.innerHTML = items.map(galleryItemHTML).join("");
  }

  if (galleryGrid) {
    // Seed once with a couple demo images
    const items = loadGallery();
    if (!items.length) {
      saveGallery([
        { src: "assets/img/greece.jpeg", caption: "Sunset in Greece" },
        { src: "assets/img/hero.svg", caption: "TripNest vibes" }
      ]);
    }
    renderGallery();

    galleryGrid.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-del]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-del"));
      const next = loadGallery().filter((_, i) => i !== idx);
      saveGallery(next);
      renderGallery();
    });
  }

  if (addPhotoForm) {
    addPhotoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = addPhotoForm.querySelector("input[type=file]");
      const captionInput = addPhotoForm.querySelector("input[name=caption]");
      const file = fileInput?.files?.[0];
      const caption = (captionInput?.value || "").trim();
      if (!file) {
        if (galleryNote) galleryNote.textContent = "Pick a photo first.";
        return;
      }

      const toDataURL = (f) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = reject;
        r.readAsDataURL(f);
      });

      try {
        const src = await toDataURL(file);
        const items = loadGallery();
        items.unshift({ src, caption });
        saveGallery(items);
        addPhotoForm.reset();
        renderGallery();
        if (galleryNote) {
          galleryNote.textContent = "✅ Added! (Stored in your browser only.)";
          setTimeout(() => (galleryNote.textContent = ""), 3500);
        }
      } catch {
        if (galleryNote) galleryNote.textContent = "Sorry — couldn't read that file.";
      }
    });
  }

  /* ---------------- Stripe payment page ---------------- */
  const payBtns = document.querySelectorAll("[data-stripe-price]");
  const payNote = $("#payNote");
  const payStatus = $("#payStatus");
  if (payStatus) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") payStatus.textContent = "✅ Payment complete. Thank you!";
    if (params.get("canceled") === "1") payStatus.textContent = "Payment canceled — no worries.";
  }
  payBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const priceId = btn.getAttribute("data-stripe-price") || "";
      if (!priceId.startsWith("price_")) {
        if (payNote) payNote.textContent = "Set your Stripe Price IDs in pay.html (data-stripe-price).";
        return;
      }
      btn.setAttribute("disabled", "true");
      if (payNote) payNote.textContent = "Redirecting to secure checkout…";
      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Request failed");
        if (json?.url) window.location.href = json.url;
        else throw new Error("No checkout url returned");
      } catch (err) {
        if (payNote) payNote.textContent = `Checkout error: ${String(err?.message || err)}`;
        btn.removeAttribute("disabled");
      }
    });
  });
})();


async function checkout(priceId) {
  try {
    const resp = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId })
    });

    // Try JSON first; if the server returned HTML/text, show it clearly.
    const text = await resp.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}

    if (!resp.ok) {
      const msg = (data && data.error) ? data.error : text.slice(0, 180);
      throw new Error(msg || `HTTP ${resp.status}`);
    }

    if (!data || !data.url) {
      throw new Error("Server did not return a checkout URL.");
    }

    window.location.href = data.url;
  } catch (e) {
    const errEl = document.getElementById("checkout-error");
    if (errEl) errEl.textContent = `Checkout error: ${e.message}`;
    else alert(`Checkout error: ${e.message}`);
  }
}
