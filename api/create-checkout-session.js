const Stripe = require('stripe');

// Vercel Serverless Function
// Env var required: STRIPE_SECRET_KEY
// Expects JSON: { "priceId": "price_..." }

module.exports = async (req, res) => {
  // Always return JSON (even for errors), so the browser fetch() doesn't choke.
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY env var' }));
      return;
    }

    // Vercel may provide req.body as an object OR a string. Handle both.
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = null; }
    }
    if (!body) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing JSON body. Send { "priceId": "price_..." }' }));
      return;
    }

    const { priceId } = body;
    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid priceId' }));
      return;
    }

    const stripe = Stripe(secretKey);

    // Determine origin for redirects (works for custom domains + previews)
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = `${proto}://${host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pay.html?success=1`,
      cancel_url: `${origin}/pay.html?canceled=1`,
      allow_promotion_codes: true
    });

    res.statusCode = 200;
    res.end(JSON.stringify({ url: session.url }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err?.message || 'Server error' }));
  }
};
