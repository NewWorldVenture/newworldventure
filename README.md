
## Customize
Edit: `assets/js/data.js` to change destinations.

---
Built for you as a starter you can extend later with:
- Supabase / Firebase for real data
- Stripe for booking payments
- A real search index (Algolia / Elasticsearch)

---

## New pages added

- **/gallery** (photo gallery; localStorage)
- **/pay** (Stripe Checkout)

### Stripe setup (Vercel)

1. In Stripe, create 3 **Products** and 3 **Prices** (one-time payments).
2. Copy each **Price ID** (starts with `price_...`).
3. Open `pay.html` and replace:
   - `price_REPLACE_DEPOSIT`
   - `price_REPLACE_PLANNING`
   - `price_REPLACE_VIP`
4. In Vercel → Project Settings → **Environment Variables** add:
   - `STRIPE_SECRET_KEY` = your Stripe secret key
5. Deploy. The payment buttons will create a Checkout Session via `/api/create-checkout-session`.

> Note: This uses Stripe Checkout (recommended for a simple flow). For subscriptions, taxes, webhooks, etc., you can extend the `api/` folder.


## Make the homepage match your screenshot even more
The homepage uses a background image set in CSS:
- `assets/img/hero.svg` (placeholder, included)

To use your own photo:
1. Put an image at `assets/img/hero.jpg` (or `.png`)
2. Edit `assets/css/styles.css` and change:

```css
.hero-bg{ background: ..., url("../img/hero.svg"); }
```

to:

```css
.hero-bg{ background: ..., url("../img/hero.jpg"); }
```

You can also swap the carousel "image" from a gradient to real photos by adding an `<img>` inside `.car-image`.


## Deploy on Vercel (works out of the box)
This project includes a `vercel.json` so Vercel will treat it as a static site and also supports clean URLs:
- `/destinations` → `destinations.html`
- `/about` → `about.html`
- `/contact` → `contact.html`

### Option A — Deploy from GitHub (recommended)
1. Create a GitHub repo and push these files.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Other**
4. Build command: **None**
5. Output directory: **.** (root)
6. Deploy.

### Option B — Vercel CLI
```bash
npm i -g vercel
vercel
```
Follow prompts, then:
```bash
vercel --prod
```

Tip: After deploy, you can visit `/destinations` (clean URL) or `/destinations.html` (direct file).
