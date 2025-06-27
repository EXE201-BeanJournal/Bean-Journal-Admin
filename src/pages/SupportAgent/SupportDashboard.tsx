import React, { useState, useEffect, useRef } from 'react';
import { User, MessageCircle, Send, Clock, Users, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSupportAgentDashboard } from '../../hooks/use-support-agent-dashboard';
import { SupportSession, SupportMessage } from '../../types/support';
import { useUser } from '@clerk/clerk-react';

// Skeleton Components
const SessionCardSkeleton: React.FC = () => (
  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const MessageSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg animate-pulse ${
          i % 2 === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

const SupportDashboard: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<SupportSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  
  const {
    pendingRequests,
    activeSessions,
    endedSessions,
    isOnline,
    setOnlineStatus,
    acceptRequest,
    sendMessage,
    endSession
  } = useSupportAgentDashboard();

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [selectedSession?.messages]);

  // Update selectedSession when activeSessions changes
  useEffect(() => {
    if (selectedSession) {
      const updatedSession = activeSessions.find(session => session.id === selectedSession.id);
      if (updatedSession && updatedSession !== selectedSession) {
        console.log('Dashboard: Updating selectedSession with new messages');
        setSelectedSession(updatedSession);
      } else if (!updatedSession && selectedSession.status !== 'ended') {
        // Session was ended, check if it's in ended sessions
        const endedSession = endedSessions.find(session => session.id === selectedSession.id);
        if (endedSession) {
          console.log('Dashboard: Session ended, updating selectedSession');
          setSelectedSession(endedSession);
        }
      }
    }
  }, [activeSessions, endedSessions, selectedSession]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedSession) return;
    
    await sendMessage(selectedSession.id, message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date | string | number) => {
    try {
      const validDate = new Date(date);
      if (isNaN(validDate.getTime())) {
        return 'Invalid time';
      }
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(validDate);
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  const getSessionDuration = (session: SupportSession) => {
    const now = new Date();
    const start = new Date(session.createdAt);
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 1 ? '<1m' : `${diffMins}m`;
  };

  const renderMessage = (msg: SupportMessage) => {
    const isAgent = msg.sender === 'agent';
    const isSystem = msg.sender === 'system';
    const isUser = msg.sender === 'user';

    return (
      <div
        key={msg.id}
        className={`flex mb-4 ${
          isAgent ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* User Avatar */}
        {isUser && !isSystem && (
          <div className="flex-shrink-0 mr-2">
            {selectedSession?.userImage ? (
              <img 
                src={selectedSession.userImage} 
                alt={selectedSession.userName || 'User'}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </div>
        )}
        
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isAgent
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
          }`}
        >
          <p className="text-sm">{msg.content}</p>
          <p className={`text-xs mt-1 ${
            isAgent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatTime(msg.timestamp)}
          </p>
        </div>
        
        {/* Agent Avatar */}
        {isAgent && !isSystem && (
          <div className="flex-shrink-0 ml-2">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Agent'}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-full"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b dark:border-gray-700 px-6 py-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-6"
          >
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || user.firstName || 'Agent'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.fullName || user?.firstName || 'Support Agent'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.primaryEmailAddress?.emailAddress || 'support@example.com'}
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge 
                variant={isOnline ? 'success' : 'secondary'}
                className="px-3 py-1 text-sm font-medium shadow-sm"
              >
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </Badge>
            </motion.div>
          </motion.div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center space-x-6"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
            >
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="text-sm">
                <span className="font-bold text-blue-600 dark:text-blue-400">{pendingRequests.length}</span>
                <span className="text-gray-600 dark:text-gray-300 ml-1">pending</span>
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg"
            >
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="text-sm">
                <span className="font-bold text-green-600 dark:text-green-400">{activeSessions.length}</span>
                <span className="text-gray-600 dark:text-gray-300 ml-1">active</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setOnlineStatus(!isOnline)}
                variant={isOnline ? 'outline' : 'default'}
                size="sm"
                className={`shadow-lg transition-all duration-300 ${
                  isOnline 
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isOnline ? '🔴 Go Offline' : '🟢 Go Online'}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-r dark:border-gray-700 flex flex-col shadow-lg"
        >
          {/* Pending Requests */}
          <div className="p-4 border-b dark:border-gray-700">
            <motion.h2 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2"
            >
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Pending Requests ({pendingRequests.length})</span>
            </motion.h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {isLoading ? (
                <AnimatePresence>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <SessionCardSkeleton />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <AnimatePresence>
                  {pendingRequests.map((request: SupportSession, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:bg-gray-800 dark:border-gray-600 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {request.userImage ? (
                        <img 
                          src={request.userImage} 
                          alt={request.userName || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.userName || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Waiting {getSessionDuration(request)}
                        </p>
                      </div>
                    </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => acceptRequest(request.id)}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
                          >
                            ✓ Accept
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {pendingRequests.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      <Clock className="w-8 h-8 mx-auto mb-2" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No pending requests
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
          </div>

          {/* Active Sessions */}
          <div className="p-4 flex flex-col flex-1 min-h-0">
            <motion.h2 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2"
            >
              <Users className="w-5 h-5 text-green-500" />
              <span>Active Sessions ({activeSessions.length})</span>
            </motion.h2>
            <div className="space-y-3 overflow-y-auto flex-1" key={`active-sessions-${activeSessions.length}-${activeSessions.map(s => s.id).join('-')}`}>
              {isLoading ? (
                <AnimatePresence>
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={`active-skeleton-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                    >
                      <SessionCardSkeleton />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <AnimatePresence>
                  {activeSessions.map((session: SupportSession, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedSession?.id === session.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 dark:border-gray-600'
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {session.userImage ? (
                        <img 
                          src={session.userImage} 
                          alt={session.userName || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.userName || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Active for {getSessionDuration(session)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {session.messages.length}
                      </span>
                    </div>
                  </div>
                      </Card>
                    </motion.div>
                  ))}
                  {activeSessions.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No active sessions
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Ended Sessions */}
          <div className="p-4 border-t dark:border-gray-700 flex flex-col max-h-80">
            <motion.h2 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5 text-gray-500" />
              <span>Ended Sessions ({endedSessions.length})</span>
            </motion.h2>
            <div className="space-y-3 overflow-y-auto flex-1">
              {isLoading ? (
                <AnimatePresence>
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={`ended-skeleton-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.1 + 0.4 }}
                    >
                      <SessionCardSkeleton />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <AnimatePresence>
                  {endedSessions.map((session: SupportSession, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedSession?.id === session.id
                            ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 dark:border-gray-600'
                        } border-l-4 border-l-gray-400`}
                        onClick={() => setSelectedSession(session)}
                      >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {session.userImage ? (
                        <img 
                          src={session.userImage} 
                          alt={session.userName || 'User'}
                          className="w-8 h-8 rounded-full object-cover opacity-75"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white">
                          {session.userName || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Ended {formatTime(new Date(session.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {session.messages.length}
                      </span>
                    </div>
                  </div>
                      </Card>
                    </motion.div>
                  ))}
                  {endedSessions.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No ended sessions
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div 
          className="flex-1 flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <motion.div 
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b dark:border-gray-700 px-6 py-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {selectedSession.userImage ? (
                        <img 
                          src={selectedSession.userImage}
                          alt={selectedSession.userName || 'User'}
                          className="w-10 h-10 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedSession.userName || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedSession.status === 'ended' ? 'bg-gray-400' : 'bg-green-500'
                        }`}></span>
                        <span>Session started {formatTime(new Date(selectedSession.createdAt))}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedSession.status === 'ended' ? (
                      <Badge variant="secondary">Session Ended</Badge>
                    ) : (
                      <>
                        <Badge variant="success">Connected</Badge>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => endSession(selectedSession.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          >
                            End Session
                          </Button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* AI Conversation History */}
              {selectedSession.aiConversationHistory && (
                <motion.div 
                  className="bg-blue-50 dark:bg-blue-900/20 border-b dark:border-gray-700 px-6 py-3"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">AI</span>
                    </div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Previous AI Conversation
                    </h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg p-3 text-xs">
                    {(() => {
                      try {
                        const history = JSON.parse(selectedSession.aiConversationHistory);
                        return history.map((msg: { type: string; content: string }, index: number) => (
                          <div key={index} className="mb-2 last:mb-0">
                            <span className={`font-medium ${
                              msg.type === 'user' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {msg.type === 'user' ? 'User' : 'AI Assistant'}:
                            </span>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                              {msg.content}
                            </span>
                          </div>
                        ));
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      } catch (_) {
                        return (
                          <div className="text-gray-500 dark:text-gray-400 italic">
                            Unable to parse conversation history
                          </div>
                        );
                      }
                    })()}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <motion.div 
                className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={`message-skeleton-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                      >
                        <MessageSkeleton />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence>
                    {selectedSession.messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {renderMessage(message)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </motion.div>

              {/* Message Input */}
              {selectedSession.status === 'ended' ? (
                <motion.div 
                  className="bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 p-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    This session has ended. No further messages can be sent.
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t dark:border-gray-700 p-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex space-x-3">
                    <motion.div 
                      className="flex-1"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div 
              className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </motion.div>
                <motion.h3 
                  className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Select a session to start chatting
                </motion.h3>
                <motion.p 
                  className="text-gray-500 dark:text-gray-400 max-w-md"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {activeSessions.length === 0 && pendingRequests.length === 0
                    ? 'No pending requests or active sessions available'
                    : 'Choose from pending requests or active sessions to begin providing support'
                  }
                </motion.p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SupportDashboard;