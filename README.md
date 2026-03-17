# Church Donation Backend

Node.js Express backend for church donations, integrating Paystack payments and Firebase Firestore.

## Features

- Paystack payment initialization
- Paystack webhook verification (HMAC-SHA512)
- Webhook idempotency to prevent duplicate donation writes
- Firebase Firestore persistence
- Donations admin API
- Health check endpoint
- Rate limiting on payment initialization

## Setup

### Prerequisites

- Node.js 18+
- Paystack account
- Firebase project with Firestore

### Install dependencies

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key (e.g. `sk_test_xxx` or `sk_live_xxx`) |
| `PAYSTACK_PUBLIC_KEY` | No | Paystack public key (for frontend use) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | One of these | Path to `serviceAccountKey.json` |
| `GOOGLE_APPLICATION_CREDENTIALS` | One of these | Alternative path to service account file |
| `FIREBASE_PROJECT_ID` | One of these | For cloud deployment without file |
| `FIREBASE_CLIENT_EMAIL` | One of these | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | One of these | Firebase service account private key (use `\n` for newlines) |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | Yes (for admin auth) | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | No | JWT expiry (default: `1h`) |

**Firebase credentials** – use one of:

1. **Service account file**: Set `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`
2. **Cloud deployment**: Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

## Running locally

```bash
npm run dev
```

Server runs on `http://localhost:5000` (or `PORT` from `.env`).

## API Endpoints

### Payment

- `POST /api/pay` – Initialize donation payment. Returns `authorization_url`. Rate limited: 100 requests per 15 minutes.

### Webhook

- `POST /api/webhook` – Paystack webhook. Must receive raw JSON body for signature verification.

### Admin

- `GET /api/donations` – List latest 50 donations. Query: `?limit=20` (max 100)
- `GET /api/donations/:reference` – Get donation by Paystack reference
- `GET /api/stats` – Returns `totalDonations`, `totalAmount`, `donationCount`

### Auth

- `POST /api/auth/login` – Admin login. Returns `{ token, user }`. Use `Authorization: Bearer TOKEN` for admin endpoints.

### Health

- `GET /health` – Returns `{ status, uptime, timestamp }`

## Webhook setup

1. Deploy the backend and get the webhook URL: `https://your-domain.com/api/webhook`
2. In Paystack Dashboard → Settings → Webhooks, add the URL
3. Ensure your server uses HTTPS in production

For local testing with ngrok:

```bash
ngrok http 5000
```

Use the ngrok URL as the webhook: `https://YOUR_SUBDOMAIN.ngrok.io/api/webhook`

## Firestore structure

Donations are stored in the `donations` collection with:

- `amount`, `currency`, `email`, `fullName`, `phone`
- `paymentStatus`, `paymentChannel`, `cardType`, `bank`, `country`
- `paystackReference`, `paystackTransactionId`, `paystackFees`
- `paidAt`, `createdAt`
- `source: "paystack"`, `environment`

### Firestore index

For efficient queries on `paystackReference`, deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

Place `firestore.indexes.json` in the project root. Single-field equality queries are auto-indexed; this file documents the schema.

## Deployment

### Cloud deployment (Railway, Render, Fly.io, etc.)

1. Set all environment variables in the platform
2. Ensure `PORT` is set (most platforms set it automatically)
3. Do not use `FIREBASE_SERVICE_ACCOUNT_PATH` with a local file; use `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` instead
4. For `FIREBASE_PRIVATE_KEY`, paste the full key; platforms typically handle newlines. If needed, use `\n` for line breaks

### Production checklist

- [ ] Use `sk_live_` Paystack key
- [ ] Set `NODE_ENV=production`
- [ ] Configure Paystack webhook to production URL
- [ ] Enable Firebase security rules for `donations` collection
- [ ] Restrict admin endpoints (e.g. add auth middleware)

## License

ISC
