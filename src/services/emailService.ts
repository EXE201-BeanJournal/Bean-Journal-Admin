import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

interface EmailConfig {
  host: string;
  email: string;
  password: string;
  imapPort: number;
  smtpPort: number;
}

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  timestamp: Date;
  read: boolean;
  replied: boolean;
  attachments?: string[];
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
}

class MailcowEmailService {
  private config: EmailConfig;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeSMTP();
  }

  private async initializeSMTP() {
    try {
      this.smtpTransporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.smtpPort,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.config.email,
          pass: this.config.password,
        },
        tls: {
          rejectUnauthorized: false, // For self-signed certificates
        },
      });

      // Verify connection
      await this.smtpTransporter.verify();
      console.log('SMTP connection established successfully');
    } catch (error) {
      console.error('Failed to initialize SMTP:', error);
    }
  }

  async fetchEmails(): Promise<Email[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.imapPort,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false, // For self-signed certificates
        },
      });

      const emails: Email[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for all emails
          imap.search(['ALL'], (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (results.length === 0) {
              resolve([]);
              imap.end();
              return;
            }

            // Fetch the latest 50 emails
            const latestResults = results.slice(-50);
            const fetch = imap.fetch(latestResults, {
              bodies: '',
              struct: true,
              markSeen: false,
            });

            fetch.on('message', (msg, seqno) => {
              let buffer = '';
              let attributes: { flags?: string[] } | null = null;

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
              });

              msg.once('attributes', (attrs) => {
                attributes = attrs;
              });

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  
                  const email: Email = {
                    id: `${seqno}`,
                    from: parsed.from?.text || 'Unknown',
                    to: Array.isArray(parsed.to) ? parsed.to[0]?.text || this.config.email : parsed.to?.text || this.config.email,
                    subject: parsed.subject || 'No Subject',
                    body: parsed.text || '',
                    htmlBody: parsed.html || undefined,
                    timestamp: parsed.date || new Date(),
                    read: attributes?.flags?.includes('\\Seen') || false,
                    replied: attributes?.flags?.includes('\\Answered') || false,
                    attachments: parsed.attachments?.map(att => att.filename || '').filter((filename): filename is string => filename !== '') || [],
                  };

                  emails.push(email);
                } catch (parseError) {
                  console.error('Failed to parse email:', parseError);
                }
              });
            });

            fetch.once('error', (err) => {
              reject(err);
            });

            fetch.once('end', () => {
              // Sort emails by timestamp (newest first)
              emails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
              resolve(emails);
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const mailOptions = {
      from: `Bean Journal Support <${this.config.email}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      inReplyTo: options.inReplyTo,
      references: options.inReplyTo,
    };

    try {
      const info = await this.smtpTransporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async markAsRead(emailId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.imapPort,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err);
            return;
          }

          imap.addFlags(emailId, '\\Seen', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
            imap.end();
          });
        });
      });

      imap.once('error', reject);
      imap.connect();
    });
  }

  async markAsReplied(emailId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.imapPort,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err);
            return;
          }

          imap.addFlags(emailId, '\\Answered', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
            imap.end();
          });
        });
      });

      imap.once('error', reject);
      imap.connect();
    });
  }

  async deleteEmail(emailId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.imapPort,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err);
            return;
          }

          imap.addFlags(emailId, '\\Deleted', (err) => {
            if (err) {
              reject(err);
              return;
            }

            imap.expunge((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
              imap.end();
            });
          });
        });
      });

      imap.once('error', reject);
      imap.connect();
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test SMTP
      if (this.smtpTransporter) {
        await this.smtpTransporter.verify();
      }

      // Test IMAP
      await new Promise<void>((resolve, reject) => {
        const imap = new Imap({
          user: this.config.email,
          password: this.config.password,
          host: this.config.host,
          port: this.config.imapPort,
          tls: true,
          tlsOptions: {
            rejectUnauthorized: false,
          },
        });

        imap.once('ready', () => {
          resolve();
          imap.end();
        });

        imap.once('error', reject);
        imap.connect();
      });

      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Configuration from environment variables
const defaultConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'mail.beanjournal.site',
  email: process.env.EMAIL_USER || 'support@beanjournal.site',
  password: process.env.EMAIL_PASSWORD || '',
  imapPort: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
  smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
};

// Create and export the email service instance
export const emailService = new MailcowEmailService(defaultConfig);
export { MailcowEmailService, type Email, type EmailConfig, type SendEmailOptions };
export default emailService;