import React, { useState, useRef, useEffect } from 'react';
import { User, MessageCircle, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSupportAgentDashboard } from '../../hooks/use-support-agent-dashboard';
import { SupportSession, SupportMessage } from '../../types/support';
import { useUser } from '@clerk/clerk-react';

const SupportDashboard: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<SupportSession | null>(null);
  const [message, setMessage] = useState('');
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

  // Debug log to see what activeSessions contains
  console.log('Dashboard activeSessions:', activeSessions);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [selectedSession?.messages]);

  // Debug effect to track activeSessions changes in UI
  useEffect(() => {
    console.log('Dashboard: activeSessions prop changed:', activeSessions);
    console.log('Dashboard: activeSessions length:', activeSessions.length);
  }, [activeSessions]);

  // Force re-render when activeSessions changes
  useEffect(() => {
    // This effect will trigger a re-render when activeSessions changes
    console.log('Dashboard: Force re-render triggered by activeSessions change');
  }, [activeSessions]);

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
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            )}
          </div>
        )}
        
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isAgent
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-100 text-gray-600 text-center'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          <p className="text-sm">{msg.content}</p>
          <p className={`text-xs mt-1 ${
            isAgent ? 'text-blue-100' : 'text-gray-500'
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
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-3 h-3 text-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || user.firstName || 'Agent'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.fullName || user?.firstName || 'Support Agent'}
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.primaryEmailAddress?.emailAddress || 'support@example.com'}
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? 'success' : 'secondary'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{pendingRequests.length}</span> pending requests
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{activeSessions.length}</span> active sessions
            </div>
            <Button
              onClick={() => setOnlineStatus(!isOnline)}
              variant={isOnline ? 'outline' : 'default'}
              size="sm"
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Pending Requests */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingRequests.map((request: SupportSession) => (
                <Card key={request.id} className="p-3 hover:bg-gray-50 cursor-pointer">
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
                        <p className="text-sm font-medium text-gray-900">
                          {request.userName || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Waiting {getSessionDuration(request)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => acceptRequest(request.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </Button>
                  </div>
                </Card>
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No pending requests
                </p>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="p-4 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Active Sessions ({activeSessions.length})
            </h2>
            <div className="space-y-2" key={`active-sessions-${activeSessions.length}-${activeSessions.map(s => s.id).join('-')}`}>
              {activeSessions.map((session: SupportSession) => (
                <Card
                  key={session.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
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
                        <p className="text-sm font-medium text-gray-900">
                          {session.userName || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Active for {getSessionDuration(session)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">
                        {session.messages.length}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              {activeSessions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No active sessions
                </p>
              )}
            </div>
          </div>

          {/* Ended Sessions */}
          <div className="p-4 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Ended Sessions ({endedSessions.length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {endedSessions.map((session: SupportSession) => (
                <Card
                  key={session.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-gray-50 border-gray-300'
                      : 'hover:bg-gray-50'
                  }`}
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
                        <p className="text-sm font-medium text-gray-700">
                          {session.userName || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ended {formatTime(new Date(session.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">
                        {session.messages.length}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              {endedSessions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No ended sessions
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {selectedSession.userImage ? (
                      <img 
                        src={selectedSession.userImage}
                        alt={selectedSession.userName || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedSession.userName || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Session started {formatTime(new Date(selectedSession.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedSession.status === 'ended' ? (
                      <Badge variant="secondary">Session Ended</Badge>
                    ) : (
                      <>
                        <Badge variant="success">Connected</Badge>
                        <Button
                          onClick={() => endSession(selectedSession.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          End Session
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {selectedSession.messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedSession.status === 'ended' ? (
                <div className="bg-gray-100 border-t p-4">
                  <div className="text-center text-gray-500">
                    This session has ended. No further messages can be sent.
                  </div>
                </div>
              ) : (
                <div className="bg-white border-t p-4">
                  <div className="flex space-x-4">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a session to start chatting
                </h3>
                <p className="text-gray-500">
                  {activeSessions.length === 0 && pendingRequests.length === 0
                    ? 'No pending requests or active sessions available'
                    : 'Choose from pending requests or active sessions in the sidebar'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;