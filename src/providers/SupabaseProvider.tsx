import React, { useState, useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../services/supabaseService";
import { SupabaseContext } from "../context/SupabaseContext";

interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  loadingAuth: boolean;
}

interface SupabaseProviderProps {
  children: ReactNode;
}

const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(
    null
  );
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setClientError(
        "Supabase client failed to initialize. Check environment variables."
      );
      setLoadingAuth(false);
      return;
    }

    setSupabaseClient(supabase);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoadingAuth(false);
      }
    );

    const getInitialSession = async () => {
      try {
        if (!supabase) throw Error("Supabase is not defined in env yet");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error getting initial Supabase session:", error);
        setClientError("Failed to fetch initial authentication session.");
      } finally {
        setLoadingAuth(false);
      }
    };

    getInitialSession();

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (clientError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Application Error
          </h2>
          <p className="text-gray-700">{clientError}</p>
          <p className="text-gray-500 text-sm mt-2">
            Please ensure environment variables are correctly configured.
          </p>
        </div>
      </div>
    );
  }

  if (loadingAuth || !supabaseClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
        <div className="text-center text-gray-600 text-lg">
          Loading application...
        </div>
      </div>
    );
  }

  const value: SupabaseContextType = {
    supabase: supabaseClient,
    session,
    loadingAuth,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;
