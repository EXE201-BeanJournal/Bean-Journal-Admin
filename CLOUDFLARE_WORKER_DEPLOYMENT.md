# Cloudflare Email Worker Deployment Guide

## Issue Fixed

The error `TypeError: message.text is not a function` has been resolved by:

1. **Added postal-mime dependency** - The Cloudflare Email Routing API doesn't provide `text()` and `html()` methods on the message object
2. **Updated email parsing** - Now uses `message.raw` (ReadableStream) with `postal-mime` to parse email content
3. **Fixed attachment handling** - Uses parsed email attachments instead of non-existent message.attachments

## Files Modified

- `cloudflare-email-worker.js` - Fixed email parsing logic
- `package.json` - Added postal-mime dependency
- `wrangler.toml` - Created worker configuration

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
In your Cloudflare dashboard, set these environment variables for your worker:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key)
- `ALLOWED_DESTINATIONS` - Comma-separated email addresses (e.g., "support@beanjournal.site,help@beanjournal.site")

### 3. Deploy the Worker
```bash
npx wrangler deploy
```

### 4. Configure Email Routing
In Cloudflare dashboard:
1. Go to Email Routing
2. Add routing rules to forward emails to your worker
3. Example: `support@beanjournal.site` → `bean-journal-email-worker`

## Key Changes Made

### Before (Broken):
```javascript
const textContent = await message.text(); // ❌ This method doesn't exist
const htmlContent = await message.html(); // ❌ This method doesn't exist
```

### After (Fixed):
```javascript
import PostalMime from 'postal-mime';

const email = await PostalMime.parse(message.raw, {
  attachmentEncoding: 'base64'
});
const textContent = email.text || '';
const htmlContent = email.html || textContent.replace(/\n/g, '<br>');
```

## Testing

After deployment:
1. Send a test email to your configured email address
2. Check Cloudflare worker logs for any errors
3. Verify emails are being stored in your Supabase database

## Troubleshooting

- **Worker still failing?** Check that postal-mime is properly installed
- **Database errors?** Verify Supabase credentials and table schema
- **Emails not routing?** Check Email Routing rules in Cloudflare dashboard