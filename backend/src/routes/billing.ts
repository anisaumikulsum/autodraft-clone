import { Router, raw } from 'express';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Stripe checkout
router.post('/checkout', authMiddleware, async (req: AuthRequest, res) => {
  const { priceId, mode = 'subscription' } = req.body;
  try {
    let customerId = req.user!.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: req.user!.email });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.user!.id }, data: { stripeCustomerId: customerId } });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode as any,
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=1`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=1`,
    });
    res.json({ url: session.url });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Checkout failed' }); }
});

// Stripe webhook
router.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const customerId = session.customer;
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    if (user) {
      const plan = session.subscription ? 'pro' : 'free';
      const creditsAdd = plan === 'pro' ? 1000 : 0;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'active',
          subscriptionTier: plan,
          credits: { increment: creditsAdd },
        },
      });
      await prisma.creditTransaction.create({
        data: { userId: user.id, amount: creditsAdd, type: 'subscription', description: `Subscription ${plan}` },
      });
    }
  }

  res.json({ received: true });
});

export { router as billingRouter };
