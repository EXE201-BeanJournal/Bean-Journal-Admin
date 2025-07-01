import { createClient } from '@supabase/supabase-js';

// Email interfaces
export interface Email {
  id: string;
  message_id: string;
  from_address: string;
  from_name?: string;
  to_address: string;
  to_name?: string;
  cc_addresses?: string[];
  bcc_addresses?: string[];
  subject?: string;
  body_text?: string;
  body_html?: string;
  is_read: boolean;
  is_replied: boolean;
  is_deleted: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  received_at: string;
  created_at: string;
  updated_at: string;
  attachments?: EmailAttachment[];
  headers?: EmailHeader[];
}

export interface EmailAttachment {
  id: string;
  email_id: string;
  filename: string;
  content_type?: string;
  size_bytes?: number;
  content_base64?: string;
  storage_url?: string;
  created_at: string;
}

export interface EmailHeader {
  id: string;
  email_id: string;
  header_name: string;
  header_value: string;
  created_at: string;
}

export interface EmailThread {
  id: string;
  subject?: string;
  participant_emails: string[];
  last_message_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  emails?: Email[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject_template?: string;
  body_template: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SendEmailRequest {
  to_address: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  reply_to_email_id?: string;
  template_id?: string;
  template_variables?: Record<string, string>;
}

export interface EmailStats {
  total_emails: number;
  unread_emails: number;
  replied_emails: number;
  deleted_emails: number;
  emails_today: number;
  emails_this_week: number;
}

export class SupabaseEmailService {
  private supabase;
  private emailServiceUrl: string;
  private emailServiceKey: string;

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'https://api.resend.com';
    this.emailServiceKey = process.env.EMAIL_SERVICE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch emails with pagination and filtering
   */
  async fetchEmails(options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    searchQuery?: string;
    sortBy?: 'received_at' | 'subject' | 'from_address';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ emails: Email[]; total: number }> {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      searchQuery = '',
      sortBy = 'received_at',
      sortOrder = 'desc'
    } = options;

    let query = this.supabase
      .from('email_management.emails')
      .select('*, attachments:email_management.email_attachments(*), headers:email_management.email_headers(*)', { count: 'exact' })
      .eq('is_deleted', false);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (searchQuery) {
      query = query.or(`subject.ilike.%${searchQuery}%,from_address.ilike.%${searchQuery}%,body_text.ilike.%${searchQuery}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }

    return {
      emails: (data as unknown as Email[]) || [],
      total: count || 0
    };
  }

  /**
   * Get a specific email by ID
   */
  async getEmailById(id: string): Promise<Email | null> {
    const { data, error } = await this.supabase
      .from('email_management.emails')
      .select('*, attachments:email_management.email_attachments(*), headers:email_management.email_headers(*)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Email not found
      }
      throw new Error(`Failed to fetch email: ${error.message}`);
    }

    return data as unknown as Email;
  }

  /**
   * Mark email as read
   */
  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_management.emails')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to mark email as read: ${error.message}`);
    }
  }

  /**
   * Mark email as replied
   */
  async markAsReplied(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_management.emails')
      .update({ is_replied: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to mark email as replied: ${error.message}`);
    }
  }

  /**
   * Delete email (soft delete)
   */
  async deleteEmail(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_management.emails')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  }

  /**
   * Send email using external service (Resend, SendGrid, etc.)
   */
  async sendEmail(emailData: SendEmailRequest): Promise<string> {
    try {
      // If template is specified, process it
      let { subject, body_text, body_html } = emailData;
      
      if (emailData.template_id) {
        const template = await this.getTemplate(emailData.template_id);
        if (template) {
          subject = this.processTemplate(template.subject_template || subject, emailData.template_variables || {});
          body_text = this.processTemplate(template.body_template, emailData.template_variables || {});
          body_html = this.processTemplate(template.body_template, emailData.template_variables || {}).replace(/\n/g, '<br>');
        }
      }

      // Send email using Resend API (you can replace with other services)
      const response = await fetch(`${this.emailServiceUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.emailServiceKey}`
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM_ADDRESS || 'support@beanjournal.site',
          to: [emailData.to_address],
          subject: subject,
          text: body_text,
          html: body_html
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Email service error: ${response.status} ${errorData}`);
      }

      const result = await response.json() as { id?: string; messageId?: string };
      const externalMessageId = result.id || result.messageId || 'unknown';

      // Log the sent email
      await this.logSentEmail({
        to_address: emailData.to_address,
        from_address: process.env.EMAIL_FROM_ADDRESS || 'support@beanjournal.site',
        subject: subject,
        body_text: body_text,
        body_html: body_html,
        status: 'sent',
        external_message_id: externalMessageId,
        reply_to_email_id: emailData.reply_to_email_id,
        sent_at: new Date().toISOString()
      });

      // If this is a reply, mark the original email as replied
      if (emailData.reply_to_email_id) {
        await this.markAsReplied(emailData.reply_to_email_id);
      }

      return externalMessageId;
    } catch (error) {
      // Log failed email
      await this.logSentEmail({
        to_address: emailData.to_address,
        from_address: process.env.EMAIL_FROM_ADDRESS || 'support@beanjournal.site',
        subject: emailData.subject,
        body_text: emailData.body_text,
        body_html: emailData.body_html,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        reply_to_email_id: emailData.reply_to_email_id
      });
      
      throw error;
    }
  }

  /**
   * Get email threads
   */
  async getEmailThreads(limit: number = 20, offset: number = 0): Promise<{ threads: EmailThread[]; total: number }> {
    const { data, error, count } = await this.supabase
      .from('email_management.email_threads')
      .select('*, messages:email_management.email_thread_messages(email:email_management.emails(*))', { count: 'exact' })
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch email threads: ${error.message}`);
    }

    return {
      threads: (data as unknown as EmailThread[]) || [],
      total: count || 0
    };
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<EmailStats> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [totalResult, unreadResult, repliedResult, deletedResult, todayResult, weekResult] = await Promise.all([
      this.supabase.from('email_management.emails').select('id', { count: 'exact', head: true }),
      this.supabase.from('email_management.emails').select('id', { count: 'exact', head: true }).eq('is_read', false).eq('is_deleted', false),
      this.supabase.from('email_management.emails').select('id', { count: 'exact', head: true }).eq('is_replied', true),
      this.supabase.from('email_management.emails').select('id', { count: 'exact', head: true }).eq('is_deleted', true),
      this.supabase.from('email_management.emails').select('id', { count: 'exact', head: true }).gte('received_at', today.toISOString().split('T')[0]),
      this.supabase.from('email_management.emails').select('id', { count: 'exact', head: true }).gte('received_at', weekAgo.toISOString())
    ]);

    return {
      total_emails: totalResult.count || 0,
      unread_emails: unreadResult.count || 0,
      replied_emails: repliedResult.count || 0,
      deleted_emails: deletedResult.count || 0,
      emails_today: todayResult.count || 0,
      emails_this_week: weekResult.count || 0
    };
  }

  /**
   * Get email templates
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await this.supabase
      .from('email_management.email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch email templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific template
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from('email_management.email_templates')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch email template: ${error.message}`);
    }

    return data;
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test Supabase connection
      const { error } = await this.supabase
        .from('email_management.emails')
        .select('id')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Supabase connection failed: ${error.message}`
        };
      }

      // Test email service (if configured)
      if (this.emailServiceKey) {
        const response = await fetch(`${this.emailServiceUrl}/domains`, {
          headers: {
            'Authorization': `Bearer ${this.emailServiceKey}`
          }
        });

        if (!response.ok) {
          return {
            success: false,
            message: `Email service connection failed: ${response.status}`
          };
        }
      }

      return {
        success: true,
        message: 'All connections successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process template variables
   */
  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return processed;
  }

  /**
   * Log sent email
   */
  private async logSentEmail(logData: {
    to_address: string;
    from_address: string;
    subject?: string;
    body_text?: string;
    body_html?: string;
    status: 'sent' | 'failed';
    external_message_id?: string;
    error_message?: string;
    reply_to_email_id?: string;
    sent_at?: string;
  }): Promise<void> {
    try {
      await this.supabase
        .from('email_management.email_sent_log')
        .insert(logData);
    } catch (error) {
      console.error('Failed to log sent email:', error);
    }
  }
}

// Export singleton instance
export const supabaseEmailService = new SupabaseEmailService();