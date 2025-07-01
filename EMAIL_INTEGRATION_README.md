# Email Integration with Cloudflare Email Routing and Supabase

This document explains the complete email integration system for the Bean Journal admin dashboard.

## System Architecture

```
Email Sender → Cloudflare Email Routing → Cloudflare Worker → Supabase Database → Admin Dashboard
                                                                                      ↓
Email Recipient ← External Email Service (Resend/SendGrid) ← Admin Dashboard Reply
```

## Components Overview

### 1. Database Schema (`email-schema.sql`)
- **emails**: Main email storage with metadata
- **email_attachments**: File attachments with base64 content
- **email_headers**: Raw email headers for debugging
- **email_threads**: Automatic email threading
- **email_templates**: Predefined response templates
- **email_sent_log**: Outgoing email tracking

### 2. Cloudflare Worker (`cloudflare-email-worker.js`)
- Receives emails via Cloudflare Email Routing
- Parses email content, headers, and attachments
- Stores everything in Supabase database
- Handles multiple email formats (text/HTML)

### 3. Supabase Email Service (`src/services/supabaseEmailService.ts`)
- Replaces the old IMAP/SMTP service
- Provides modern API for email management
- Supports pagination, search, and filtering
- Integrates with external email services for sending

### 4. Updated API Routes (`src/api/email.ts`)
- Enhanced endpoints with new features
- Support for email statistics and templates
- Thread management capabilities

## Key Features

### Email Reception
- ✅ Automatic email parsing and storage
- ✅ Attachment handling (base64 encoded)
- ✅ Header preservation for debugging
- ✅ Automatic threading by subject
- ✅ Duplicate prevention via Message-ID

### Email Management
- ✅ Pagination and search
- ✅ Read/unread status tracking
- ✅ Reply status tracking
- ✅ Soft delete functionality
- ✅ Email statistics dashboard

### Email Sending
- ✅ Template-based responses
- ✅ HTML and text email support
- ✅ Reply tracking and threading
- ✅ Multiple email service providers
- ✅ Send log with error tracking

### Advanced Features
- ✅ Email threading and conversations
- ✅ Template system with variables
- ✅ Statistics and analytics
- ✅ Attachment management
- ✅ Header analysis

## API Endpoints

### Email Management
```
GET    /api/email/fetch          # Get emails with pagination/search
GET    /api/email/:id            # Get specific email
PUT    /api/email/:id/mark-read  # Mark email as read
PUT    /api/email/:id/mark-replied # Mark email as replied
DELETE /api/email/:id            # Delete email (soft delete)
```

### Email Sending
```
POST   /api/email/send           # Send new email or reply
```

### Analytics & Templates
```
GET    /api/email/stats          # Get email statistics
GET    /api/email/templates      # Get email templates
GET    /api/email/threads        # Get email threads
```

### System
```
GET    /api/email/test-connection # Test system connectivity
```

## Environment Variables

### Required for Supabase
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Required for Email Sending
```env
# Resend (Recommended)
EMAIL_SERVICE_URL=https://api.resend.com
EMAIL_SERVICE_KEY=re_your_api_key
EMAIL_FROM_ADDRESS=support@beanjournal.site
EMAIL_FROM_NAME=Bean Journal Support
```

### Required for Cloudflare Worker
```env
# Set these in Cloudflare Worker environment
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ALLOWED_DESTINATIONS=support@beanjournal.site
```

## Setup Instructions

### 1. Database Setup
```sql
-- Run the email-schema.sql in your Supabase SQL editor
-- This creates all necessary tables and functions
```

### 2. Cloudflare Configuration
1. Enable Email Routing for your domain
2. Create and deploy the Cloudflare Worker
3. Set up routing rule: `support@beanjournal.site` → Worker
4. Configure Worker environment variables

### 3. Email Service Setup
1. Sign up for Resend (or alternative)
2. Verify your domain
3. Get API key and update `.env`

### 4. Application Setup
```bash
# Install dependencies (already done)
npm install

# Start the backend server
npm run start:server

# Start the frontend (in another terminal)
npm run dev
```

## Usage Examples

### Fetching Emails with Pagination
```javascript
// GET /api/email/fetch?limit=20&offset=0&unreadOnly=true&search=urgent
const response = await fetch('/api/email/fetch?limit=20&offset=0&unreadOnly=true');
const { emails, total, count } = await response.json();
```

### Sending a Reply
```javascript
// POST /api/email/send
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to_address: 'customer@example.com',
    subject: 'Re: Your Support Request',
    body_html: '<p>Thank you for contacting us...</p>',
    reply_to_email_id: 'uuid-of-original-email'
  })
});
```

### Using Templates
```javascript
// POST /api/email/send with template
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to_address: 'customer@example.com',
    subject: 'Welcome to Bean Journal',
    template_id: 'welcome-template-uuid',
    template_variables: {
      customer_name: 'John Doe',
      original_subject: 'Account Setup'
    }
  })
});
```

### Getting Statistics
```javascript
// GET /api/email/stats
const response = await fetch('/api/email/stats');
const { stats } = await response.json();
// Returns: total_emails, unread_emails, replied_emails, etc.
```

## Email Templates

The system includes predefined templates:

1. **Welcome Response**: Auto-acknowledgment
2. **Issue Resolved**: Closure notification
3. **Follow Up**: Check-in message

Template variables use `{{variable_name}}` syntax:
```
Subject: Re: {{original_subject}}
Body: Hi {{customer_name}}, thank you for contacting us...
```

## Email Threading

Emails are automatically grouped into threads based on:
- Cleaned subject line (removes Re:, Fwd:, etc.)
- Participant email addresses
- Chronological order

Threads help organize conversations and provide context.

## Monitoring and Debugging

### Health Check
```bash
curl http://localhost:3001/api/email/test-connection
```

### Common Issues

1. **Emails not appearing**
   - Check Cloudflare Worker logs
   - Verify Supabase permissions
   - Test Worker environment variables

2. **Cannot send emails**
   - Verify email service API key
   - Check domain verification
   - Review rate limits

3. **Database errors**
   - Check Supabase connection
   - Verify schema is applied
   - Review RLS policies if enabled

### Logs and Monitoring

- **Cloudflare Worker**: Real-time logs in CF dashboard
- **Supabase**: Query logs and performance metrics
- **Email Service**: Delivery status and bounce handling
- **Application**: Console logs for API calls

## Performance Considerations

### Database
- Indexes on frequently queried columns
- Pagination for large email volumes
- Soft deletes to maintain history

### Attachments
- Base64 storage for small files (<1MB)
- Consider Supabase Storage for larger files
- Compression for text-based attachments

### Email Service
- Rate limiting awareness
- Retry logic for failed sends
- Queue system for high volumes

## Security

### Data Protection
- Service role key only in Worker
- Encrypted environment variables
- No sensitive data in client code

### Access Control
- RLS policies available (commented in schema)
- Admin-only email management
- Secure API endpoints

### Email Security
- SPF/DKIM verification via Cloudflare
- Spam filtering at routing level
- Attachment scanning considerations

## Migration from Old System

If migrating from the old IMAP/SMTP system:

1. **Data Migration**: Export existing emails if needed
2. **API Updates**: Frontend already updated to use new endpoints
3. **Configuration**: Update environment variables
4. **Testing**: Verify all functionality works
5. **Cutover**: Switch DNS/routing to new system

## Future Enhancements

### Planned Features
- [ ] Email scheduling
- [ ] Auto-responders
- [ ] Email signatures
- [ ] Advanced search filters
- [ ] Email forwarding rules
- [ ] Integration with ticketing systems

### Scalability
- [ ] Email archiving strategy
- [ ] Performance optimization
- [ ] Multi-tenant support
- [ ] Advanced analytics

## Support

For issues or questions:
1. Check this documentation
2. Review setup guide (`CLOUDFLARE_EMAIL_SETUP.md`)
3. Test individual components
4. Check logs and error messages

The new email system provides a modern, scalable foundation for customer support email management with room for future enhancements.