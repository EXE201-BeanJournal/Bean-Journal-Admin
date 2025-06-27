export interface SupportAgent {
  id: string;
  name: string;
  email?: string;
  image?: string;
  isOnline: boolean;
}

export interface SupportMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  agentId?: string;
}

export interface SupportSession {
  id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  agentId?: string;
  agentName?: string;
  status: 'waiting' | 'connected' | 'ended';
  messages: SupportMessage[];
  createdAt: Date;
}

export interface SupportRequest {
  id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  timestamp: Date;
  message?: string;
}