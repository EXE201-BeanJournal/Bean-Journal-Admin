import { createContext, useContext, useMemo, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { Database } from '../types/database';
import { createSupportSchemaClient, createPublicSchemaClient } from '../utils/dualSchemaSupabase';

interface SupabaseContextType {
  supabase: SupabaseClient<Database, 'bean_ai_realtime', Database['bean_ai_realtime']> | null;
  publicSupabase: SupabaseClient | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    try {
      return createSupportSchemaClient(async () => getToken({template: 'supabase'}));
    } catch (error) {
      console.error("Failed to create Support Supabase client in provider:", error);
      return null;
    }
  }, [getToken]);

  const publicSupabase = useMemo(() => {
    try {
      return createPublicSchemaClient(async () => getToken({template: 'supabase'}));
    } catch (error) {
      console.error("Failed to create Public Supabase client in provider:", error);
      return null;
    }
  }, [getToken]);

  return (
    <SupabaseContext.Provider value={{ supabase, publicSupabase } as SupabaseContextType}>
      {children}
    </SupabaseContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSupabase = (): SupabaseClient<Database, 'bean_ai_realtime', Database['bean_ai_realtime']> | null => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider. Make sure the component is a child of SupabaseProvider.');
  }
  return context.supabase;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePublicSupabase = (): SupabaseClient | null => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('usePublicSupabase must be used within a SupabaseProvider. Make sure the component is a child of SupabaseProvider.');
  }
  return context.publicSupabase;
};