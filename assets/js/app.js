(function () {

const flexAmountInput = document.getElementById("flexAmount");
const flexCheckoutBtn = document.getElementById("flexCheckoutBtn");
const payNote = document.getElementById("payNote");

async function startCheckout(payload) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Request failed");
  window.location.href = json.url;
}

if (flexCheckoutBtn && flexAmountInput) {
  flexCheckoutBtn.addEventListener("click", async () => {
    const amount = Number(flexAmountInput.value);

    console.log("Sending amount:", amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      payNote.textContent = "Enter a valid amount";
      return;
    }

    try {
      await startCheckout({ amount });
    } catch (err) {
      payNote.textContent = err.message;
    }
  });
}

})();
