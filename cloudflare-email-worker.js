// Cloudflare Worker for Email Routing Integration
// This worker receives emails via Cloudflare Email Routing and stores them in Supabase

// Environment variables needed:
// SUPABASE_URL - Your Supabase project URL
// SUPABASE_SERVICE_ROLE_KEY - Service role key (not anon key) for database writes
// ALLOWED_DESTINATIONS - Comma-separated list of allowed email addresses (e.g., "support@beanjournal.site,help@beanjournal.site")

// Using built-in email parsing instead of postal-mime for Cloudflare Workers compatibility

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
  },

  async fetch(request, env, ctx) {
    return new Response('Cloudflare Email Worker is running. This worker processes incoming emails via Cloudflare Email Routing.', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

/**
 * Parse the incoming email message using built-in methods
 */
async function parseEmailMessage(message) {
  // Read the raw email content
  const rawEmail = await streamToString(message.raw);
  
  // Parse headers and content from raw email
  const { headers, body } = parseRawEmail(rawEmail);
  
  // Extract basic email information
  const subject = headers['subject'] || '(No Subject)';
  const fromHeader = headers['from'] || message.from;
  const toHeader = headers['to'] || message.to;
  
  // Parse from address
  const fromMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([^\s]+@[^\s]+)/);
  const fromAddress = fromMatch ? fromMatch[1] : fromHeader;
  const fromName = fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '');
  
  // Parse to address
  const toMatch = toHeader.match(/<([^>]+)>/) || toHeader.match(/([^\s]+@[^\s]+)/);
  const toAddress = toMatch ? toMatch[1] : toHeader;
  const toName = toHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '');
  
  // Extract CC and BCC
  const ccAddresses = headers['cc'] ? extractEmailAddresses(headers['cc']) : [];
  const bccAddresses = headers['bcc'] ? extractEmailAddresses(headers['bcc']) : [];
  
  // Simple content extraction (basic implementation)
  const textContent = extractTextContent(body);
  const htmlContent = extractHtmlContent(body) || textContent.replace(/\n/g, '<br>');
  
  // Basic attachment detection (simplified)
   const attachments = extractAttachments(body);
  
  return {
    message_id: headers['message-id'] || `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from_address: fromAddress,
    from_name: fromName,
    to_address: toAddress,
    to_name: toName,
    cc_addresses: ccAddresses,
    bcc_addresses: bccAddresses,
    subject: subject,
    body_text: textContent,
    body_html: htmlContent,
    received_at: new Date().toISOString(),
    headers: headers,
    attachments: attachments
  };
}

/**
 * Convert ReadableStream to string
 */
async function streamToString(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode(); // flush
    return result;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse raw email into headers and body
 */
function parseRawEmail(rawEmail) {
  const lines = rawEmail.split('\r\n');
  const headers = {};
  let bodyStart = 0;
  
  // Find the end of headers (empty line)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '') {
      bodyStart = i + 1;
      break;
    }
    
    // Parse header line
    const colonIndex = lines[i].indexOf(':');
    if (colonIndex > 0) {
      const key = lines[i].substring(0, colonIndex).toLowerCase().trim();
      const value = lines[i].substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  
  const body = lines.slice(bodyStart).join('\r\n');
  return { headers, body };
}

/**
 * Extract email addresses from a header value
 */
function extractEmailAddresses(headerValue) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return headerValue.match(emailRegex) || [];
}

/**
 * Extract text content from email body
 */
function extractTextContent(body) {
  // Simple text extraction - look for text/plain content
   const textMatch = body.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\nContent-Type|$)/i);
   if (textMatch) {
     return textMatch[1].trim();
   }
  
  // Fallback: return body as-is if no MIME structure detected
  return body.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract HTML content from email body
 */
function extractHtmlContent(body) {
  // Simple HTML extraction - look for text/html content
   const htmlMatch = body.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\nContent-Type|$)/i);
   if (htmlMatch) {
     return htmlMatch[1].trim();
   }
  
  return null;
}

/**
 * Extract basic attachment information
 */
function extractAttachments(body) {
  const attachments = [];
  
  // Simple attachment detection based on Content-Disposition
  const attachmentRegex = /Content-Disposition: attachment; filename="([^"]+)"/gi;
  let match;
  
  while ((match = attachmentRegex.exec(body)) !== null) {
    attachments.push({
      filename: match[1],
      content_type: 'application/octet-stream',
      size_bytes: 0,
      content_base64: '' // Simplified - not extracting actual content
    });
  }
  
  return attachments;
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