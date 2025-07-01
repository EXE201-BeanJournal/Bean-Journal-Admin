// Cloudflare Worker for Email Routing Integration
// This worker receives emails via Cloudflare Email Routing and stores them in Supabase

// Environment variables needed:
// SUPABASE_URL - Your Supabase project URL
// SUPABASE_SERVICE_ROLE_KEY - Service role key (not anon key) for database writes
// ALLOWED_DESTINATIONS - Comma-separated list of allowed email addresses (e.g., "support@beanjournal.site,help@beanjournal.site")

export default {
  async email(message, env, ctx) {
    try {
      // Validate that this email is for an allowed destination
      const allowedDestinations = env.ALLOWED_DESTINATIONS?.split(',').map(email => email.trim()) || [];
      const toAddress = message.to;
      
      if (allowedDestinations.length > 0 && !allowedDestinations.includes(toAddress)) {
        console.log(`Email to ${toAddress} not in allowed destinations: ${allowedDestinations.join(', ')}`);
        return; // Silently ignore emails to non-allowed addresses
      }

      // Parse email content
      const emailData = await parseEmailMessage(message);
      
      // Store email in Supabase
      await storeEmailInSupabase(emailData, env);
      
      console.log(`Successfully processed email from ${emailData.from_address} to ${emailData.to_address}`);
      
    } catch (error) {
      console.error('Error processing email:', error);
      // Don't throw error to avoid email bouncing
    }
  }
};

/**
 * Parse the incoming email message
 */
async function parseEmailMessage(message) {
  const headers = {};
  
  // Extract headers
  for (const [key, value] of message.headers) {
    headers[key.toLowerCase()] = value;
  }
  
  // Get email content
  const textContent = await message.text();
  let htmlContent = '';
  
  // Try to get HTML content if available
  try {
    htmlContent = await message.html();
  } catch (e) {
    // HTML not available, use text content
    htmlContent = textContent.replace(/\n/g, '<br>');
  }
  
  // Parse from address
  const fromMatch = message.from.match(/^(.+?)\s*<(.+)>$/) || [null, '', message.from];
  const fromName = fromMatch[1]?.trim().replace(/^["']|["']$/g, '') || '';
  const fromAddress = fromMatch[2] || message.from;
  
  // Parse to address
  const toMatch = message.to.match(/^(.+?)\s*<(.+)>$/) || [null, '', message.to];
  const toName = toMatch[1]?.trim().replace(/^["']|["']$/g, '') || '';
  const toAddress = toMatch[2] || message.to;
  
  // Extract CC and BCC if available
  const ccAddresses = headers.cc ? headers.cc.split(',').map(addr => addr.trim()) : [];
  const bccAddresses = headers.bcc ? headers.bcc.split(',').map(addr => addr.trim()) : [];
  
  // Get attachments
  const attachments = [];
  if (message.attachments) {
    for (const attachment of message.attachments) {
      const content = await attachment.arrayBuffer();
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(content)));
      
      attachments.push({
        filename: attachment.name || 'attachment',
        content_type: attachment.type || 'application/octet-stream',
        size_bytes: content.byteLength,
        content_base64: base64Content
      });
    }
  }
  
  return {
    message_id: headers['message-id'] || `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from_address: fromAddress,
    from_name: fromName,
    to_address: toAddress,
    to_name: toName,
    cc_addresses: ccAddresses,
    bcc_addresses: bccAddresses,
    subject: message.subject || '(No Subject)',
    body_text: textContent,
    body_html: htmlContent,
    received_at: new Date().toISOString(),
    headers: headers,
    attachments: attachments
  };
}

/**
 * Store email data in Supabase database
 */
async function storeEmailInSupabase(emailData, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  // Insert email record
  const emailResponse = await fetch(`${supabaseUrl}/rest/v1/email_management.emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      message_id: emailData.message_id,
      from_address: emailData.from_address,
      from_name: emailData.from_name,
      to_address: emailData.to_address,
      to_name: emailData.to_name,
      cc_addresses: emailData.cc_addresses,
      bcc_addresses: emailData.bcc_addresses,
      subject: emailData.subject,
      body_text: emailData.body_text,
      body_html: emailData.body_html,
      received_at: emailData.received_at
    })
  });
  
  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    throw new Error(`Failed to insert email: ${emailResponse.status} ${errorText}`);
  }
  
  const insertedEmail = await emailResponse.json();
  const emailId = insertedEmail[0].id;
  
  // Insert email headers
  if (Object.keys(emailData.headers).length > 0) {
    const headerInserts = Object.entries(emailData.headers).map(([name, value]) => ({
      email_id: emailId,
      header_name: name,
      header_value: value
    }));
    
    const headersResponse = await fetch(`${supabaseUrl}/rest/v1/email_management.email_headers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify(headerInserts)
    });
    
    if (!headersResponse.ok) {
      console.error('Failed to insert email headers:', await headersResponse.text());
    }
  }
  
  // Insert attachments
  if (emailData.attachments.length > 0) {
    const attachmentInserts = emailData.attachments.map(attachment => ({
      email_id: emailId,
      filename: attachment.filename,
      content_type: attachment.content_type,
      size_bytes: attachment.size_bytes,
      content_base64: attachment.content_base64
    }));
    
    const attachmentsResponse = await fetch(`${supabaseUrl}/rest/v1/email_management.email_attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify(attachmentInserts)
    });
    
    if (!attachmentsResponse.ok) {
      console.error('Failed to insert email attachments:', await attachmentsResponse.text());
    }
  }
  
  return emailId;
}

// Optional: Add a fetch handler for testing/debugging
export async function fetch(request, env, ctx) {
  return new Response('Cloudflare Email Worker is running. This worker processes incoming emails via Cloudflare Email Routing.', {
    headers: { 'Content-Type': 'text/plain' }
  });
}