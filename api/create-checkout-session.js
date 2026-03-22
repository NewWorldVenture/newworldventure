const Stripe = require('stripe');

// Vercel Serverless Function
// Env var required: STRIPE_SECRET_KEY
// Expects JSON: { "priceId": "price_..." } OR { "amount": 123.45 }

module.exports = async (req, res) => {
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

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {
        body = null;
      }
    }

    if (!body) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        error: 'Missing JSON body. Send { "priceId": "price_..." } or { "amount": 123.45 }'
      }));
      return;
    }

    const stripe = Stripe(secretKey);

    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = `${proto}://${host}`;

    const { priceId, amount } = body;

    let sessionConfig = {
      mode: 'payment',
      success_url: `${origin}/pay.html?success=1`,
      cancel_url: `${origin}/pay.html?canceled=1`,
    };

    if (priceId) {
      if (typeof priceId !== 'string' || !priceId.startsWith('price_')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid priceId' }));
        return;
      }

      sessionConfig.line_items = [
        { price: priceId, quantity: 1 }
      ];

      // OK for fixed-price products
      sessionConfig.allow_promotion_codes = true;
    } else {
      const parsedAmount = Number(amount);

      if (!Number.isFinite(parsedAmount)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid amount' }));
        return;
      }

      const unitAmount = Math.round(parsedAmount * 100);

      if (unitAmount < 50) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Minimum amount is $0.50' }));
        return;
      }

      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Flex Payment',
              description: 'Custom payment amount'
            },
            unit_amount: unitAmount
          },
          quantity: 1
        }
      ];

      // DO NOT enable promo codes for the custom amount flow
      sessionConfig.metadata = {
        payment_type: 'flex',
        entered_amount: parsedAmount.toFixed(2)
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.statusCode = 200;
    res.end(JSON.stringify({ url: session.url }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err?.message || 'Server error' }));
  }
};