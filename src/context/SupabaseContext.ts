import { createContext, useContext } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

export interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  loadingAuth: boolean;
}

export const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
