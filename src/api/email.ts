import express, { RequestHandler } from 'express';
import { supabaseEmailService } from '../services/supabaseEmailService.js';

const router = express.Router();

// GET /api/email/test-connection
const testConnectionHandler: RequestHandler = async (_req, res) => {
  try {
    const result = await supabaseEmailService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Email connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.get('/test-connection', testConnectionHandler);

// GET /api/email/health - Simple health check
const healthCheckHandler: RequestHandler = async (_req, res) => {
  try {
    res.json({
      success: true,
      message: 'Email API is running',
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!(process.env.VITE_SUPABASE_URL),
        hasSupabaseKey: !!(process.env.VITE_SUPABASE_ANON_KEY),
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.get('/health', healthCheckHandler);

// GET /api/email/fetch
const fetchEmailsHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    console.log('Email fetch request received:', req.query);
    
    const {
      limit = '50',
      offset = '0',
      unreadOnly = 'false',
      search = '',
      sortBy = 'received_at',
      sortOrder = 'desc'
    } = req.query;

    // Validate parameters
    const parsedLimit = parseInt(limit as string);
    const parsedOffset = parseInt(offset as string);
    
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
       res.status(400).json({
         success: false,
         message: 'Invalid limit or offset parameters',
         error: 'Parameters must be valid numbers'
       });
       return;
     }

    const result = await supabaseEmailService.fetchEmails({
      limit: parsedLimit,
      offset: parsedOffset,
      unreadOnly: unreadOnly === 'true',
      searchQuery: search as string,
      sortBy: sortBy as 'received_at' | 'subject' | 'from_address',
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    console.log('Email fetch successful:', { count: result.emails.length, total: result.total });

    res.json({ 
      success: true, 
      emails: result.emails,
      total: result.total,
      count: result.emails.length
    });
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    
    // Ensure we always send a JSON response
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch emails',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

router.get('/fetch', fetchEmailsHandler);

// POST /api/email/send
const sendEmailHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { to_address, subject, body_text, body_html, reply_to_email_id, template_id, template_variables } = req.body;
    
    if (!to_address || !subject || (!body_text && !body_html && !template_id)) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: to_address, subject, and either body_text/body_html or template_id'
      });
      return;
    }

    const messageId = await supabaseEmailService.sendEmail({
      to_address,
      subject,
      body_text,
      body_html,
      reply_to_email_id,
      template_id,
      template_variables
    });
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      message_id: messageId
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.post('/send', sendEmailHandler);

// PUT /api/email/:id/mark-read
const markAsReadHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await supabaseEmailService.markAsRead(id);
    
    res.json({ 
      success: true, 
      message: 'Email marked as read' 
    });
  } catch (error) {
    console.error('Failed to mark email as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark email as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.put('/:id/mark-read', markAsReadHandler);

// PUT /api/email/:id/mark-replied
const markAsRepliedHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await supabaseEmailService.markAsReplied(id);
    
    res.json({ 
      success: true, 
      message: 'Email marked as replied' 
    });
  } catch (error) {
    console.error('Failed to mark email as replied:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark email as replied',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.put('/:id/mark-replied', markAsRepliedHandler);

// DELETE /api/email/:id
const deleteEmailHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await supabaseEmailService.deleteEmail(id);
    
    res.json({ 
      success: true, 
      message: 'Email deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/email/:id
const getEmailHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await supabaseEmailService.getEmailById(id);
    
    if (!email) {
      res.status(404).json({
        success: false,
        message: 'Email not found'
      });
      return;
    }
    
    res.json({ 
      success: true, 
      email
    });
  } catch (error) {
    console.error('Failed to get email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/email/stats
const getStatsHandler: RequestHandler = async (_req, res) => {
  try {
    const stats = await supabaseEmailService.getEmailStats();
    
    res.json({ 
      success: true, 
      stats
    });
  } catch (error) {
    console.error('Failed to get email stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get email stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/email/templates
const getTemplatesHandler: RequestHandler = async (_req, res) => {
  try {
    const templates = await supabaseEmailService.getTemplates();
    
    res.json({ 
      success: true, 
      templates
    });
  } catch (error) {
    console.error('Failed to get email templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get email templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/email/threads
const getThreadsHandler: RequestHandler = async (req, res) => {
  try {
    const { limit = '20', offset = '0' } = req.query;
    
    const result = await supabaseEmailService.getEmailThreads(
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({ 
      success: true, 
      threads: result.threads,
      total: result.total
    });
  } catch (error) {
    console.error('Failed to get email threads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get email threads',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Register routes
router.get('/stats', getStatsHandler);
router.get('/templates', getTemplatesHandler);
router.get('/threads', getThreadsHandler);
router.get('/:id', getEmailHandler);
router.delete('/:id', deleteEmailHandler);

export default router;