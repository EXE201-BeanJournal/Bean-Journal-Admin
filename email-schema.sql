-- Email Management Schema for Cloudflare Email Routing Integration
-- This schema creates tables to store emails received via Cloudflare Workers

-- Create a new schema for email management
CREATE SCHEMA IF NOT EXISTS email_management;

-- Set the search path to include the new schema
SET search_path TO email_management, public;

-- Table to store email messages
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE NOT NULL, -- RFC 2822 Message-ID
    from_address VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    to_address VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    cc_addresses TEXT[], -- Array of CC addresses
    bcc_addresses TEXT[], -- Array of BCC addresses
    subject VARCHAR(500),
    body_text TEXT,
    body_html TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_replied BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store email attachments
CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size_bytes INTEGER,
    content_base64 TEXT, -- Base64 encoded content
    storage_url VARCHAR(500), -- URL if stored externally (e.g., Supabase Storage)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store email headers (for debugging and advanced features)
CREATE TABLE IF NOT EXISTS email_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    header_name VARCHAR(100) NOT NULL,
    header_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store email threads/conversations
CREATE TABLE IF NOT EXISTS email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(500),
    participant_emails TEXT[] NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table to link emails to threads
CREATE TABLE IF NOT EXISTS email_thread_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    position_in_thread INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, email_id)
);

-- Table to store email templates for replies
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subject_template VARCHAR(500),
    body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID, -- Reference to admin user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store email sending log
CREATE TABLE IF NOT EXISTS email_sent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_address VARCHAR(255) NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body_text TEXT,
    body_html TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    external_message_id VARCHAR(255), -- ID from email service provider
    reply_to_email_id UUID REFERENCES emails(id),
    sent_by UUID, -- Reference to admin user
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_to_address ON emails(to_address);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_is_replied ON emails(is_replied);
CREATE INDEX IF NOT EXISTS idx_emails_is_deleted ON emails(is_deleted);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_headers_email_id ON email_headers(email_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_at ON email_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_sent_log_status ON email_sent_log(status);
CREATE INDEX IF NOT EXISTS idx_email_sent_log_sent_at ON email_sent_log(sent_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_threads_updated_at BEFORE UPDATE ON email_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically thread emails
CREATE OR REPLACE FUNCTION auto_thread_email()
RETURNS TRIGGER AS $$
DECLARE
    thread_id_var UUID;
    clean_subject VARCHAR(500);
BEGIN
    -- Clean subject by removing Re:, Fwd:, etc.
    clean_subject := TRIM(REGEXP_REPLACE(NEW.subject, '^(Re:|RE:|Fwd:|FWD:|Fw:|FW:)\s*', '', 'gi'));
    
    -- Try to find existing thread
    SELECT t.id INTO thread_id_var
    FROM email_threads t
    WHERE LOWER(TRIM(REGEXP_REPLACE(t.subject, '^(Re:|RE:|Fwd:|FWD:|Fw:|FW:)\s*', '', 'gi'))) = LOWER(clean_subject)
    AND (NEW.from_address = ANY(t.participant_emails) OR NEW.to_address = ANY(t.participant_emails))
    ORDER BY t.last_message_at DESC
    LIMIT 1;
    
    -- If no thread found, create new one
    IF thread_id_var IS NULL THEN
        INSERT INTO email_threads (subject, participant_emails, last_message_at, message_count)
        VALUES (
            clean_subject,
            ARRAY[NEW.from_address, NEW.to_address],
            NEW.received_at,
            1
        )
        RETURNING id INTO thread_id_var;
    ELSE
        -- Update existing thread
        UPDATE email_threads
        SET 
            last_message_at = NEW.received_at,
            message_count = message_count + 1,
            participant_emails = ARRAY(
                SELECT DISTINCT unnest(
                    participant_emails || ARRAY[NEW.from_address, NEW.to_address]
                )
            )
        WHERE id = thread_id_var;
    END IF;
    
    -- Add email to thread
    INSERT INTO email_thread_messages (thread_id, email_id, position_in_thread)
    VALUES (
        thread_id_var,
        NEW.id,
        (SELECT COALESCE(MAX(position_in_thread), 0) + 1 FROM email_thread_messages WHERE thread_id = thread_id_var)
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-threading
CREATE TRIGGER auto_thread_email_trigger AFTER INSERT ON emails
    FOR EACH ROW EXECUTE FUNCTION auto_thread_email();

-- Create RLS (Row Level Security) policies if needed
-- Note: Uncomment and modify these if you need user-specific access control

-- ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_headers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_thread_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_sent_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (modify as needed)
-- CREATE POLICY "Users can view all emails" ON emails FOR SELECT USING (true);
-- CREATE POLICY "Users can update email status" ON emails FOR UPDATE USING (true);

-- Grant permissions (adjust as needed for your setup)
GRANT USAGE ON SCHEMA email_management TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA email_management TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA email_management TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA email_management TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA email_management TO authenticated, anon;

-- Insert some sample email templates
INSERT INTO email_templates (name, subject_template, body_template) VALUES
('Welcome Response', 'Re: {{original_subject}}', 'Thank you for contacting Bean Journal support. We have received your message and will respond within 24 hours.\n\nBest regards,\nBean Journal Support Team'),
('Issue Resolved', 'Re: {{original_subject}} - Resolved', 'Hi {{customer_name}},\n\nWe are pleased to inform you that your issue has been resolved. If you have any further questions, please don''t hesitate to contact us.\n\nBest regards,\nBean Journal Support Team'),
('Follow Up', 'Follow up: {{original_subject}}', 'Hi {{customer_name}},\n\nWe wanted to follow up on your recent inquiry. Is there anything else we can help you with?\n\nBest regards,\nBean Journal Support Team');

COMMIT;