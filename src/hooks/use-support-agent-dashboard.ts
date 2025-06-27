'use client'

import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { SupportSession, SupportMessage, SupportAgent } from '../types/support';
import { useSupabase } from '../context/SupabaseContext';
import { useSession, useUser } from '@clerk/clerk-react';
import { Database } from '../types/database';

// Get current agent from Clerk user data
const getCurrentAgent = (user: {
  id?: string;
  fullName?: string;
  firstName?: string;
  primaryEmailAddress?: {
    emailAddress?: string;
  };
  imageUrl?: string;
}): SupportAgent => ({
  id: user?.id || 'agent_1',
  name: user?.fullName || user?.firstName || 'Support Agent',
  email: user?.primaryEmailAddress?.emailAddress,
  image: user?.imageUrl,
  isOnline: true
});

export const useSupportAgentDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<SupportSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<SupportSession[]>([]);
  const [endedSessions, setEndedSessions] = useState<SupportSession[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [, setSupabase] = useState<SupabaseClient<Database, 'bean_ai_realtime', Database['bean_ai_realtime']> | null>(null);
  const [acceptingRequests, setAcceptingRequests] = useState<Set<string>>(new Set());
  const { session } = useSession();
  const { user } = useUser();
  const agent = getCurrentAgent(user ? {
    id: user.id,
    fullName: user.fullName || undefined,
    firstName: user.firstName || undefined,
    primaryEmailAddress: {
      emailAddress: user.primaryEmailAddress?.emailAddress
    },
    imageUrl: user.imageUrl || undefined
  } : {});
  const supabase = useSupabase();

  // Load existing sessions from database
  const loadExistingSessions = useCallback(async (supabaseClient: SupabaseClient<Database, 'bean_ai_realtime', Database['bean_ai_realtime']>) => {
    try {
      // Load sessions from database (including ended sessions for admin view)
      const { data: sessions, error: sessionsError } = await supabaseClient
        .from('support_sessions')
        .select('*')
        .in('status', ['waiting', 'connected', 'ended'])
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
        return;
      }

      if (!sessions || sessions.length === 0) {
        console.log('No existing sessions found');
        return;
      }

      // Load messages for each session
      const sessionsWithMessages = await Promise.all(
        sessions.map(async (session) => {
          const { data: messages, error: messagesError } = await supabaseClient
            .from('support_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('timestamp', { ascending: true });

          if (messagesError) {
            console.error(`Error loading messages for session ${session.id}:`, messagesError);
            return null;
          }

          const processedMessages = (messages || []).map((msg) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: new Date(msg.timestamp || msg.created_at || new Date().toISOString()),
            agentId: msg.agent_id || undefined
          }));

          return {
            id: session.id,
            userId: session.user_id,
            userName: session.user_name,
            userImage: session.user_image,
            agentId: session.agent_id,
            agentName: session.agent_name,
            status: session.status,
            createdAt: new Date(session.created_at || new Date().toISOString()),
            messages: processedMessages
          };
        })
      );

      // Filter out any null sessions (failed to load)
      const validSessions = sessionsWithMessages.filter(session => session !== null);

      // Debug: Log all sessions with their statuses
      console.log('All valid sessions:', validSessions.map(s => ({ id: s.id, status: s.status, userName: s.userName })));
      
      // Separate pending, active, and ended sessions
      const pending = validSessions.filter(session => session.status === 'waiting');
      const active = validSessions.filter(session => session.status === 'connected');
      const ended = validSessions.filter(session => session.status === 'ended');

      console.log(`Loaded ${pending.length} pending, ${active.length} active, and ${ended.length} ended sessions`);
      console.log('Pending sessions:', pending.map(s => ({ id: s.id, status: s.status })));
      console.log('Active sessions:', active.map(s => ({ id: s.id, status: s.status })));
      console.log('Ended sessions:', ended.map(s => ({ id: s.id, status: s.status })));
      setPendingRequests(pending.map(session => ({
        ...session,
        userName: session.userName || undefined,
        userImage: session.userImage || undefined,
        agentId: session.agentId || undefined,
        agentName: session.agentName || undefined
      })));
      const mappedActiveSessions = active.map(session => ({
        ...session,
        userName: session.userName || undefined,
        userImage: session.userImage || undefined,
        agentId: session.agentId || undefined,
        agentName: session.agentName || undefined
      }));
      console.log('Setting active sessions:', mappedActiveSessions);
      setActiveSessions(mappedActiveSessions);
      
      const mappedEndedSessions = ended.map(session => ({
        ...session,
        userName: session.userName || undefined,
        userImage: session.userImage || undefined,
        agentId: session.agentId || undefined,
        agentName: session.agentName || undefined
      }));
      console.log('Setting ended sessions:', mappedEndedSessions);
      setEndedSessions(mappedEndedSessions);
      
      // Force a state update to ensure UI re-renders
      setTimeout(() => {
        console.log('Force refresh active sessions state');
        setActiveSessions(prev => [...prev]);
      }, 100);
    } catch (error) {
      console.error('Error loading existing sessions:', error);
    }
  }, []);

  // Save sessions to localStorage for persistence
  const saveSessionsToStorage = useCallback((pending: SupportSession[], active: SupportSession[]) => {
    try {
      const allSessions = [...pending, ...active];
      localStorage.setItem('support_sessions', JSON.stringify(allSessions));
      console.log('Saved sessions to localStorage:', allSessions);
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }, []);

  // Update sessions and save to storage
  useEffect(() => {
    saveSessionsToStorage(pendingRequests, activeSessions);
  }, [pendingRequests, activeSessions, saveSessionsToStorage]);

  // Debug effect to track active sessions changes
  useEffect(() => {
    console.log('Active sessions state updated:', activeSessions);
    console.log('Active sessions count:', activeSessions.length);
  }, [activeSessions]);

  // Debug effect to track pending requests changes
  useEffect(() => {
    console.log('Pending requests state updated:', pendingRequests);
    console.log('Pending requests count:', pendingRequests.length);
  }, [pendingRequests]);

  // Initialize Supabase connection
  useEffect(() => {
    if (!session || !supabase) return;

    try {
      setSupabase(supabase);

      // Load existing sessions first
      loadExistingSessions(supabase);

      // Create support channel for real-time communication
      const supportChannel = supabase.channel('support-requests', {
        config: {
          presence: {
            key: agent.id,
          },
        },
      });

      // Listen for new support requests
      supportChannel
        .on('broadcast', { event: 'support-request' }, (payload) => {
          console.log('New support request:', payload);
          const newSession: SupportSession = {
            id: payload.payload.sessionId,
            userId: payload.payload.userId,
            userName: payload.payload.userName || 'Anonymous User',
            userImage: payload.payload.userImage,
            status: 'waiting',
            messages: [
              {
                id: `msg_${Date.now()}`,
                content: payload.payload.initialMessage || 'Looking for an available agent...',
                sender: 'user' as const,
                timestamp: new Date()
              }
            ],
            createdAt: new Date()
          };
          setPendingRequests(prev => [...prev, newSession]);
        })
        .on('broadcast', { event: 'user-message' }, (payload) => {
          console.log('User message received:', payload);
          const { sessionId, message } = payload.payload;
          console.log('Processing message for session:', sessionId, 'Message:', message);
          
          // Ensure timestamp is a proper Date object
          const processedMessage: SupportMessage = {
            ...message,
            timestamp: new Date(message.timestamp)
          };
          
          console.log('Processed message:', processedMessage);
          
          // Update both pending requests and active sessions
          setPendingRequests(prev => {
            const updated = prev.map(session => 
              session.id === sessionId
                ? { ...session, messages: [...session.messages, processedMessage] }
                : session
            );
            console.log('Updated pending requests:', updated);
            return updated;
          });
          
          setActiveSessions(prev => {
            const updated = prev.map(session => 
              session.id === sessionId
                ? { ...session, messages: [...session.messages, processedMessage] }
                : session
            );
            console.log('Updated active sessions:', updated);
            return updated;
          });
          
          // Force a re-render by updating the state again
          setTimeout(() => {
            setActiveSessions(prev => [...prev]);
          }, 10);
        })
        .on('broadcast', { event: 'session-ended' }, (payload) => {
          console.log('Session ended event received:', payload);
          const { sessionId } = payload.payload;
          
          // Move session from active to ended
          setActiveSessions(prev => {
            const sessionToEnd = prev.find(s => s.id === sessionId);
            if (sessionToEnd) {
              const endedSession = { ...sessionToEnd, status: 'ended' as const };
              setEndedSessions(prevEnded => [endedSession, ...prevEnded]);
              console.log('Moved session to ended:', sessionId);
              return prev.filter(s => s.id !== sessionId);
            }
            return prev;
          });
        })
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence synced');
        })
        .subscribe();

      setChannel(supportChannel);
      
      // Automatically set agent online when dashboard loads
      setTimeout(async () => {
        setIsOnline(true);
        
        // Update agent status in database
        try {
          const { error } = await supabase
            .from('support_agents')
            .upsert({
              id: agent.id,
              name: agent.name,
              email: agent.email,
              image_url: agent.image,
              is_online: true,
              last_seen: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error('Error updating agent status on initialization:', error);
          } else {
            console.log('Agent status initialized in database successfully');
          }
        } catch (error) {
          console.error('Error initializing agent status:', error);
        }
        
        // Track presence
        supportChannel.track({
          ...agent,
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
      }, 1000);

      return () => {
        supportChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize Supabase connection:', error);
    }
  }, [session, supabase, agent.id, agent.name, agent.email, agent.image, user]);

  // Set agent online/offline status
  const setOnlineStatus = useCallback(async (online: boolean) => {
    setIsOnline(online);
    
    if (channel && supabase && user) {
      try {
        console.log('Updating agent status:', {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          image_url: agent.image,
          is_online: online
        });
        
        // Update agent status in database
        const { error } = await supabase
          .from('support_agents')
          .upsert({
            id: agent.id,
            name: agent.name,
            email: agent.email,
            image_url: agent.image,
            is_online: online,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error updating agent status:', error);
        } else {
          console.log('Agent status updated successfully in database');
        }

        if (online) {
          // Track agent presence when going online
          await channel.track({
            ...agent,
            isOnline: true,
            lastSeen: new Date().toISOString()
          });
          console.log('Agent presence tracked');
        } else {
          // Untrack presence when going offline
          await channel.untrack();
          console.log('Agent presence untracked');
        }
      } catch (error) {
        console.error('Error setting online status:', error);
      }
    }
  }, [channel, agent, supabase, user]);

  // Accept a support request
  const acceptRequest = useCallback(async (sessionId: string) => {
    const request = pendingRequests.find(r => r.id === sessionId);
    if (!request || !channel) return;
    
    // Prevent double-click duplication
    if (acceptingRequests.has(sessionId)) {
      console.log('Request already being processed:', sessionId);
      return;
    }
    
    setAcceptingRequests(prev => new Set(prev).add(sessionId));

    try {
      // Update session in database
      const { error: sessionError } = await supabase!
        .from('support_sessions')
        .update({
          agent_id: agent.id,
          agent_name: agent.name,
          status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error updating session:', sessionError);
        return;
      }

      const joinMessage: SupportMessage = {
        id: `msg_${Date.now()}`,
        content: `${agent.name} has joined the conversation. How can I help you today?`,
        sender: 'agent' as const,
        timestamp: new Date(),
        agentId: agent.id
      };

      // Save join message to database
      const { error: messageError } = await supabase!
        .from('support_messages')
        .insert({
          id: joinMessage.id,
          session_id: sessionId,
          content: joinMessage.content,
          sender: 'agent',
          agent_id: agent.id,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error saving join message:', messageError);
      }

      // Move from pending to active
      setPendingRequests(prev => prev.filter(r => r.id !== sessionId));
      
      const activeSession: SupportSession = {
        ...request,
        agentId: agent.id,
        agentName: agent.name,
        status: 'connected',
        messages: [
          ...request.messages,
          joinMessage
        ]
      };

      setActiveSessions(prev => [...prev, activeSession]);

      // Notify user that agent connected
      await channel.send({
        type: 'broadcast',
        event: 'agent-connected',
        payload: {
          sessionId,
          userId: request.userId,
          agentId: agent.id,
          agentName: agent.name,
          agentImage: agent.image
        }
      });

      // Send the join message to the user
      await channel.send({
        type: 'broadcast',
        event: 'support-message',
        payload: {
          sessionId,
          message: joinMessage
        }
      });
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      // Clean up the accepting requests set
      setAcceptingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  }, [pendingRequests, channel, agent, supabase, acceptingRequests]);

  // Send message to user
  const sendMessage = useCallback(async (sessionId: string, content: string) => {
    if (!channel) return;

    const message: SupportMessage = {
      id: `msg_${Date.now()}`,
      content,
      sender: 'agent' as const,
      timestamp: new Date(),
      agentId: agent.id
    };

    try {
      // Save message to database
      const { error } = await supabase!
        .from('support_messages')
        .insert({
          id: message.id,
          session_id: sessionId,
          content: message.content,
          sender: 'agent',
          agent_id: agent.id,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving agent message:', error);
        return;
      }

      // Update local state
      setActiveSessions(prev => prev.map(session => 
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message] }
          : session
      ));

      // Send to user
      await channel.send({
        type: 'broadcast',
        event: 'support-message',
        payload: {
          sessionId,
          message
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [channel, agent, supabase]);

  // End support session
  const endSession = useCallback(async (sessionId: string) => {
    if (!channel) return;

    try {
      console.log('Ending session:', sessionId);
      
      // Find the session to move to ended list first
      const sessionToEnd = activeSessions.find(s => s.id === sessionId);
      if (!sessionToEnd) {
        console.error('Session not found in active sessions:', sessionId);
        return;
      }

      // Update session status in database
      const { error } = await supabase!
        .from('support_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending session in database:', error);
        // Continue with local state update even if database fails
      }

      // Add "This session has ended" message
      const endMessage: SupportMessage = {
        id: `msg_end_${Date.now()}`,
        content: 'This session has ended',
        sender: 'system' as const,
        timestamp: new Date(),
      };

      // Save end message to database
      const { error: messageError } = await supabase!
        .from('support_messages')
        .insert({
          id: endMessage.id,
          session_id: sessionId,
          content: endMessage.content,
          sender: 'system',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Error saving end message:', messageError);
      }

      const endedSession = {
        ...sessionToEnd,
        status: 'ended' as const,
        messages: [...sessionToEnd.messages, endMessage]
      };

      // Update state immediately for responsive UI
      console.log('Updating local state - removing from active sessions');
      setActiveSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        console.log('Active sessions after removal:', updated.length);
        return updated;
      });
      
      console.log('Updating local state - adding to ended sessions');
      setEndedSessions(prev => {
        const updated = [endedSession, ...prev];
        console.log('Ended sessions after addition:', updated.length);
        return updated;
      });

      // Force re-render to ensure UI updates
      setTimeout(() => {
        console.log('Force re-render triggered');
        setActiveSessions(prev => [...prev]);
        setEndedSessions(prev => [...prev]);
      }, 50);

      // Notify user
      await channel.send({
        type: 'broadcast',
        event: 'session-ended',
        payload: {
          sessionId
        }
      });
      
      console.log('Session ended successfully:', sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
      
      // Fallback: still try to update local state
      const sessionToEnd = activeSessions.find(s => s.id === sessionId);
      if (sessionToEnd) {
        const endedSession = { ...sessionToEnd, status: 'ended' as const };
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        setEndedSessions(prev => [endedSession, ...prev]);
      }
    }
  }, [channel, supabase, activeSessions]);

  return {
    isOnline,
    pendingRequests,
    activeSessions,
    endedSessions,
    setOnlineStatus,
    acceptRequest,
    sendMessage,
    endSession
  };
};