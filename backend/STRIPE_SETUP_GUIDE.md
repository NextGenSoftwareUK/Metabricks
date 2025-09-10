# 🏗️ Stripe Setup Guide for MetaBricks

## 📋 Prerequisites

1. **Stripe Account**: Create one at [stripe.com](https://stripe.com)
2. **Heroku Account**: For hosting the backend
3. **MetaBricks Backend**: Already configured

## 🔑 Required Environment Variables

Set these in your Heroku app:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL
FRONTEND_URL=https://metabricks.vercel.app
```

## 🚀 Step-by-Step Setup

### 1. Get Your Stripe Keys

1. **Login to Stripe Dashboard**
2. **Go to Developers → API Keys**
3. **Copy your Secret Key** (starts with `sk_test_` for testing)
4. **Set it in Heroku**: `STRIPE_SECRET_KEY`

### 2. Create Webhook Endpoint

1. **In Stripe Dashboard**: Go to Developers → Webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://metabricks-backend-api-66e7d2abb038.herokuapp.com/webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Copy the webhook secret** (starts with `whsec_`)
6. **Set it in Heroku**: `STRIPE_WEBHOOK_SECRET`

### 3. Set Environment Variables in Heroku

```bash
# Via Heroku CLI
heroku config:set STRIPE_SECRET_KEY=sk_test_your_key_here
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
heroku config:set FRONTEND_URL=https://metabricks.vercel.app

# Or via Heroku Dashboard
# Settings → Config Vars → Add the variables above
```

### 4. Test the Setup

1. **Deploy your backend**:
   ```bash
   git add .
   git commit -m "Fix Stripe integration and add comprehensive logging"
   git push heroku main
   ```

2. **Check Stripe status**:
   ```
   https://metabricks-backend-api-66e7d2abb038.herokuapp.com/test-stripe
   ```

3. **Test a payment**:
   - Go to your frontend
   - Click on a brick
   - Choose Stripe payment
   - Use test card: `4242 4242 4242 4242`

## 🧪 Test Cards

Use these for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## 🔍 Troubleshooting

### Common Issues:

1. **"Stripe not configured"**
   - Check `STRIPE_SECRET_KEY` is set in Heroku

2. **"Webhook signature verification failed"**
   - Check `STRIPE_WEBHOOK_SECRET` is set
   - Verify webhook URL is correct

3. **"Failed to create checkout session"**
   - Check Stripe key is valid
   - Verify brick ID is between 1-432

### Debug Endpoints:

- **Stripe Status**: `/test-stripe`
- **Brick Status**: `/debug-bricks`
- **Health Check**: `/health`

## 📱 Frontend Integration

The frontend automatically:
1. **Creates Stripe session** when user clicks "Pay with Stripe"
2. **Opens Stripe checkout** in new tab
3. **Polls for payment status**
4. **Marks brick as sold** when payment completes

## 💰 Pricing

- **All bricks**: $50 USD
- **Currency**: USD only
- **Payment methods**: All major credit cards
- **Promo codes**: Supported

## 🔄 Webhook Flow

1. **User completes payment** on Stripe
2. **Stripe sends webhook** to your backend
3. **Backend verifies signature**
4. **Brick marked as sold**
5. **NFT metadata updated**
6. **User can mint NFT**

## 🚨 Security Notes

- **Never expose** your Stripe secret key
- **Always verify** webhook signatures
- **Use HTTPS** for all endpoints
- **Test thoroughly** before going live

## 📞 Support

If you encounter issues:
1. Check Heroku logs: `heroku logs --tail`
2. Verify environment variables
3. Test with Stripe's test mode first
4. Check the `/test-stripe` endpoint

---

**Your MetaBricks Stripe integration is now ready! 🎉**
