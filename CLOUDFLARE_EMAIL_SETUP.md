# Cloudflare Email Routing Integration Setup Guide

This guide will help you integrate Cloudflare Email Routing with your Bean Journal admin dashboard using Supabase for email storage.

## Overview

The integration consists of:
1. **Cloudflare Email Routing** - Receives emails sent to `support@beanjournal.site`
2. **Cloudflare Worker** - Processes incoming emails and stores them in Supabase
3. **Supabase Database** - Stores emails, attachments, and metadata
4. **Admin Dashboard** - Displays and manages emails
5. **External Email Service** - Sends reply emails (Resend, SendGrid, etc.)

## Step 1: Set Up Supabase Database

### 1.1 Run the Email Schema

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `email-schema.sql`
4. Execute the SQL to create the email management schema

### 1.2 Get Supabase Service Role Key

1. In your Supabase dashboard, go to Settings > API
2. Copy the `service_role` key (not the `anon` key)
3. Keep this secure - it will be used in the Cloudflare Worker

## Step 2: Set Up Cloudflare Email Routing

### 2.1 Enable Email Routing

1. Log in to your Cloudflare dashboard
2. Select your domain (`beanjournal.site`)
3. Go to Email > Email Routing
4. Click "Enable Email Routing"
5. Follow the setup wizard to configure DNS records

### 2.2 Create Email Address

1. In Email Routing, go to "Routing rules"
2. Click "Create address"
3. Set up `support@beanjournal.site`
4. For now, set it to forward to your personal email (we'll change this to the Worker later)

## Step 3: Deploy Cloudflare Worker

### 3.1 Create Worker

1. In Cloudflare dashboard, go to Workers & Pages
2. Click "Create application" > "Create Worker"
3. Name it `email-processor` or similar
4. Replace the default code with the contents of `cloudflare-email-worker.js`

### 3.2 Configure Worker Environment Variables

1. In the Worker settings, go to "Variables"
2. Add these environment variables:
   ```
   SUPABASE_URL=https://esmuwiclbmirvjhwolrh.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ALLOWED_DESTINATIONS=support@beanjournal.site,help@beanjournal.site
   ```
3. Make sure to encrypt the `SUPABASE_SERVICE_ROLE_KEY`

### 3.3 Deploy Worker

1. Click "Save and Deploy"
2. Note the Worker URL (e.g., `email-processor.your-subdomain.workers.dev`)

## Step 4: Configure Email Routing to Use Worker

### 4.1 Update Routing Rule

1. Go back to Email Routing > Routing rules
2. Edit the `support@beanjournal.site` rule
3. Change the action from "Send to an email" to "Send to a Worker"
4. Select your `email-processor` worker
5. Save the changes

### 4.2 Test Email Reception

1. Send a test email to `support@beanjournal.site`
2. Check the Worker logs in Cloudflare dashboard
3. Verify the email appears in your Supabase database

## Step 5: Configure External Email Service

### 5.1 Set Up Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (`beanjournal.site`)
3. Get your API key
4. Update your `.env` file:
   ```
   EMAIL_SERVICE_URL=https://api.resend.com
   EMAIL_SERVICE_KEY=re_your_api_key_here
   EMAIL_FROM_ADDRESS=support@beanjournal.site
   EMAIL_FROM_NAME=Bean Journal Support
   ```

### 5.2 Alternative: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your domain
3. Get your API key
4. Update your `.env` file:
   ```
   EMAIL_SERVICE_URL=https://api.sendgrid.com/v3
   EMAIL_SERVICE_KEY=SG.your_api_key_here
   EMAIL_FROM_ADDRESS=support@beanjournal.site
   EMAIL_FROM_NAME=Bean Journal Support
   ```

## Step 6: Update Admin Dashboard

### 6.1 Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 6.2 Update Environment Variables

Ensure your `.env` file has all the required variables (already done if you followed the previous steps).

### 6.3 Restart Backend Server

```bash
npm run start:server
```

## Step 7: Test the Complete Flow

### 7.1 Test Email Reception

1. Send an email to `support@beanjournal.site`
2. Check the admin dashboard - the email should appear
3. Verify all email details are captured correctly

### 7.2 Test Email Sending

1. In the admin dashboard, try replying to an email
2. Check that the reply is sent successfully
3. Verify the original email is marked as "replied"

## Troubleshooting

### Common Issues

1. **Emails not appearing in dashboard**
   - Check Cloudflare Worker logs
   - Verify Supabase connection in Worker
   - Check database permissions

2. **Cannot send replies**
   - Verify email service API key
   - Check domain verification status
   - Review email service logs

3. **CORS errors**
   - Ensure backend server is running
   - Check FRONTEND_URL in .env
   - Verify API endpoints are accessible

### Debugging Steps

1. **Check Worker Logs**
   ```
   Cloudflare Dashboard > Workers & Pages > Your Worker > Logs
   ```

2. **Test Supabase Connection**
   ```
   curl -X GET 'https://esmuwiclbmirvjhwolrh.supabase.co/rest/v1/email_management.emails' \
   -H "apikey: YOUR_ANON_KEY" \
   -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

3. **Test Email Service**
   ```bash
   # Test connection endpoint
   curl http://localhost:3001/api/email/test-connection
   ```

## Security Considerations

1. **Supabase Service Role Key**
   - Never expose this key in client-side code
   - Only use it in the Cloudflare Worker
   - Encrypt it in Worker environment variables

2. **Email Service API Keys**
   - Keep these secure in environment variables
   - Use different keys for development and production

3. **Row Level Security (RLS)**
   - Consider enabling RLS on email tables if you have multiple tenants
   - The schema includes commented RLS policies you can uncomment

## Advanced Features

### Email Templates

The system includes email templates for common responses:
- Welcome Response
- Issue Resolved
- Follow Up

You can create custom templates in the `email_templates` table.

### Email Threading

Emails are automatically grouped into threads based on subject line and participants.

### Attachments

Email attachments are stored as base64 in the database. For large attachments, consider using Supabase Storage.

### Analytics

The system tracks email statistics:
- Total emails
- Unread count
- Response rates
- Daily/weekly volumes

## Production Deployment

1. **Environment Variables**
   - Set all production URLs in `.env`
   - Use production API keys
   - Configure proper CORS origins

2. **Database Backup**
   - Enable Supabase automatic backups
   - Consider point-in-time recovery

3. **Monitoring**
   - Set up Cloudflare Worker alerts
   - Monitor email service quotas
   - Track database performance

4. **Scaling**
   - Cloudflare Workers scale automatically
   - Supabase handles database scaling
   - Monitor email service limits

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Cloudflare Worker logs
3. Test each component individually
4. Verify all environment variables are set correctly

The integration provides a robust, scalable email management system that can handle high volumes of support emails while maintaining good performance and reliability.