/**
 * Billing — Stripe Checkout subscriptions for the paid property-search product.
 * Card data never touches this app: /subscribe redirects to Stripe's hosted
 * Checkout page. Subscription status is only ever written by the webhook
 * handler (stripeWebhookHandler), which server.js mounts separately with a
 * raw body parser since Stripe requires the unparsed body for signature
 * verification.
 */
const express = require('express');
const router  = express.Router();
const Stripe  = require('stripe');
const usersDB = require('../db/users');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual:  process.env.STRIPE_PRICE_ANNUAL,
};

function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// Newer Stripe API versions moved current_period_end off the top-level
// Subscription object and onto its first subscription item.
function currentPeriodEnd(sub) {
  const raw = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return raw ? new Date(raw * 1000) : null;
}

router.get('/subscribe', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login?next=/subscribe');
  res.render('subscribe', { error: req.query.error || null });
});

router.post('/subscribe', async (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login?next=/subscribe');
  if (!stripe) return res.redirect('/subscribe?error=Billing+is+not+configured+yet');

  const plan = req.body.plan === 'annual' ? 'annual' : 'monthly';
  const price = PRICES[plan];
  if (!price) return res.redirect('/subscribe?error=Billing+is+not+configured+yet');

  try {
    const user = await usersDB.findById(req.session.userId);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: String(user.id),
      customer: user.stripe_customer_id || undefined,
      customer_email: user.stripe_customer_id ? undefined : user.email,
      success_url: `${baseUrl(req)}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl(req)}/billing/cancel`,
      metadata: { user_id: String(user.id), plan },
    });
    res.redirect(303, session.url);
  } catch (err) {
    console.error('[billing] Checkout session error:', err.message);
    res.redirect('/subscribe?error=Could+not+start+checkout.+Please+try+again');
  }
});

router.get('/billing/success', (req, res) => {
  res.render('billing-success');
});

router.get('/billing/cancel', (req, res) => {
  res.render('billing-cancel');
});

// Mounted directly in server.js with express.raw() — not through the normal
// express.json() pipeline — so req.body here is a Buffer, not parsed JSON.
async function stripeWebhookHandler(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[billing] Webhook received but Stripe is not configured');
    return res.status(500).end();
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[billing] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.client_reference_id || session.metadata?.user_id, 10);
        if (userId) {
          await usersDB.updateStripeCustomerId(userId, session.customer);
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            await usersDB.updateSubscription(userId, {
              stripe_subscription_id: sub.id,
              subscription_status: sub.status,
              subscription_plan: session.metadata?.plan || null,
              subscription_expires_at: currentPeriodEnd(sub),
            });
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = await usersDB.findByStripeCustomerId(sub.customer);
        if (user) {
          await usersDB.updateSubscription(user.id, {
            stripe_subscription_id: sub.id,
            subscription_status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
            subscription_plan: user.subscription_plan,
            subscription_expires_at: currentPeriodEnd(sub),
          });
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[billing] Webhook handling error:', err.message);
    res.status(500).end();
  }
}

module.exports = router;
module.exports.stripeWebhookHandler = stripeWebhookHandler;
