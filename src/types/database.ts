// Database types for bean_ai_realtime schema

export interface Database {
  bean_ai_realtime: {
    Tables: {
      support_agents: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          image_url: string | null;
          is_online: boolean | null;
          last_seen: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          email?: string | null;
          image_url?: string | null;
          is_online?: boolean | null;
          last_seen?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          image_url?: string | null;
          is_online?: boolean | null;
          last_seen?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      support_sessions: {
        Row: {
          id: string;
          user_id: string;
          user_name: string | null;
          user_image: string | null;
          agent_id: string | null;
          agent_name: string | null;
          status: 'waiting' | 'connected' | 'ended';
          ai_conversation_history: string | null;
          created_at: string | null;
          updated_at: string | null;
          ended_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          user_name?: string | null;
          user_image?: string | null;
          agent_id?: string | null;
          agent_name?: string | null;
          status: 'waiting' | 'connected' | 'ended';
          ai_conversation_history?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string | null;
          user_image?: string | null;
          agent_id?: string | null;
          agent_name?: string | null;
          status?: 'waiting' | 'connected' | 'ended';
          ai_conversation_history?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_sessions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "support_agents";
            referencedColumns: ["id"];
          }
        ];
      };
      support_messages: {
        Row: {
          id: string;
          session_id: string;
          content: string;
          sender: 'user' | 'agent' | 'system';
          user_id: string | null;
          agent_id: string | null;
          timestamp: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          session_id: string;
          content: string;
          sender: 'user' | 'agent' | 'system';
          user_id?: string | null;
          agent_id?: string | null;
          timestamp?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          content?: string;
          sender?: 'user' | 'agent' | 'system';
          user_id?: string | null;
          agent_id?: string | null;
          timestamp?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "support_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_messages_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "support_agents";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      requesting_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Type alias for the specific schema
export type BeanAiRealtimeDatabase = Database['bean_ai_realtime'];

// Utility types for easier access
export type SupportAgentRow = Database['bean_ai_realtime']['Tables']['support_agents']['Row'];
export type SupportSessionRow = Database['bean_ai_realtime']['Tables']['support_sessions']['Row'];
export type SupportMessageRow = Database['bean_ai_realtime']['Tables']['support_messages']['Row'];

export type SupportAgentInsert = Database['bean_ai_realtime']['Tables']['support_agents']['Insert'];
export type SupportSessionInsert = Database['bean_ai_realtime']['Tables']['support_sessions']['Insert'];
export type SupportMessageInsert = Database['bean_ai_realtime']['Tables']['support_messages']['Insert'];

export type SupportAgentUpdate = Database['bean_ai_realtime']['Tables']['support_agents']['Update'];
export type SupportSessionUpdate = Database['bean_ai_realtime']['Tables']['support_sessions']['Update'];
export type SupportMessageUpdate = Database['bean_ai_realtime']['Tables']['support_messages']['Update'];