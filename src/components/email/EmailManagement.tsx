import React, { useState, useEffect } from 'react';
import { Mail, Send, Trash2, Reply, RefreshCw, User, Clock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface Email {
  id: string;
  from_address: string;
  to_address: string;
  subject: string;
  body_text: string;
  body_html?: string;
  received_at: string;
  is_read: boolean;
  is_replied: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
  thread_id?: string;
  message_id: string;
}

interface EmailManagementProps {
  className?: string;
}

const EmailManagement: React.FC<EmailManagementProps> = ({ className = '' }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const emailsPerPage = 20;

  // Email configuration
  const EMAIL_CONFIG = {
    supportEmail: 'support@beanjournal.site'
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async (page = 0, search = '', unreadOnly = false) => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';
      const params = new URLSearchParams({
        limit: emailsPerPage.toString(),
        offset: (page * emailsPerPage).toString(),
        sortBy: 'received_at',
        sortOrder: 'desc'
      });
      
      if (search) params.append('search', search);
      if (unreadOnly) params.append('unreadOnly', 'true');
      
      const response = await fetch(`${baseUrl}/api/email/fetch?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 200)}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const emailsWithDates = data.emails.map((email: Email) => ({
          ...email,
          timestamp: new Date(email.received_at)
        }));
        setEmails(emailsWithDates);
        setTotalEmails(data.total || 0);
      } else {
        console.error('Failed to fetch emails:', data.message);
        alert('Failed to fetch emails: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      alert('Failed to fetch emails. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendReply = async (emailId: string, content: string) => {
    if (!content.trim() || !selectedEmail) return;

    setIsSending(true);
    try {
      const baseUrl = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';
      const response = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_address: selectedEmail.from_address,
          subject: `Re: ${selectedEmail.subject}`,
          body_text: content,
          body_html: `<p>${content.replace(/\n/g, '<br>')}</p>`,
          reply_to_email_id: emailId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 200)}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mark as replied
        await fetch(`${baseUrl}/api/email/${emailId}/mark-replied`, {
          method: 'PUT'
        });

        // Update email as replied
        setEmails(prev => prev.map(email => 
          email.id === emailId 
            ? { ...email, is_replied: true, is_read: true }
            : email
        ));

        // Update selected email
        if (selectedEmail) {
          setSelectedEmail({ ...selectedEmail, is_replied: true, is_read: true });
        }

        setReplyContent('');
        setShowReplyForm(false);
        
        alert('Reply sent successfully!');
      } else {
        throw new Error(data.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const baseUrl = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';
      await fetch(`${baseUrl}/api/email/${emailId}/mark-read`, {
        method: 'PUT'
      });
      
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, is_read: true } : email
      ));
    } catch (error) {
      console.error('Failed to mark email as read:', error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      const baseUrl = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';
      const response = await fetch(`${baseUrl}/api/email/${emailId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 200)}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEmails(prev => prev.filter(email => email.id !== emailId));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null);
        }
        alert('Email deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete email');
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
      alert('Failed to delete email: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Search is now handled server-side, but we keep this for immediate filtering
  const filteredEmails = emails.filter(email => 
    email.from_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmails(0, searchTerm, showUnreadOnly);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, showUnreadOnly]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = emails.filter(email => !email.is_read).length;
  const unrepliedCount = emails.filter(email => !email.is_replied && email.is_read).length;
  const totalPages = Math.ceil(totalEmails / emailsPerPage);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Email Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {EMAIL_CONFIG.supportEmail} • {totalEmails} total emails
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="destructive" className="px-3 py-1">
              {unreadCount} unread
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              {unrepliedCount} pending
            </Badge>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-2"
              >
                <span>{showUnreadOnly ? 'Show All' : 'Unread Only'}</span>
              </Button>
              <Button
                onClick={() => fetchEmails(currentPage, searchTerm, showUnreadOnly)}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage + 1} of {totalPages} • {totalEmails} total emails
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    fetchEmails(newPage, searchTerm, showUnreadOnly);
                  }}
                  disabled={currentPage === 0 || isLoading}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    fetchEmails(newPage, searchTerm, showUnreadOnly);
                  }}
                  disabled={currentPage >= totalPages - 1 || isLoading}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Email List */}
        <div className="w-1/3 border-r dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                {filteredEmails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-b dark:border-gray-700 cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    } ${!email.is_read ? 'bg-blue-25 dark:bg-blue-950/10' : ''}`}
                    onClick={() => {
                      setSelectedEmail(email);
                      if (!email.is_read) {
                        markAsRead(email.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm truncate ${
                              !email.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {email.from_address}
                            </p>
                            {!email.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className={`text-sm truncate mt-1 ${
                            !email.is_read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                            {email.body_text}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(new Date(email.received_at))}
                        </span>
                        <div className="flex space-x-1">
                          {email.is_replied && (
                            <Badge variant="success" className="text-xs px-1 py-0">
                              ✓
                            </Badge>
                          )}
                          {email.attachments && email.attachments.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              📎
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {!isLoading && filteredEmails.length === 0 && (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No emails found matching your search.' : 'No emails found.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{selectedEmail.from_address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(selectedEmail.received_at).toLocaleString()}</span>
                        </div>
                        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span>📎 {selectedEmail.attachments.length} attachment(s)</span>
                          </div>
                        )}
                      </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </Button>
                    <Button
                      onClick={() => deleteEmail(selectedEmail.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none">
                  {selectedEmail.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {selectedEmail.body_text}
                    </div>
                  )}
                </div>
                
                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 border-t dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Attachments ({selectedEmail.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs">📎</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {attachment.content_type} • {Math.round(attachment.size / 1024)}KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <AnimatePresence>
                {showReplyForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="p-6">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reply to: {selectedEmail.from_address}
                        </label>
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Type your reply..."
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Press Ctrl+Enter to send
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => setShowReplyForm(false)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => sendReply(selectedEmail.id, replyContent)}
                            disabled={!replyContent.trim() || isSending}
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>{isSending ? 'Sending...' : 'Send Reply'}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select an email
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose an email from the list to view its contents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailManagement;