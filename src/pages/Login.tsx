import React, { useState, useEffect } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { signInWithGoogle } from "../services/supabaseService";

const LoginPage: React.FC<NavigateProps> = ({ navigateTo }) => {
  const { session, loadingAuth } = useSupabase();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!loadingAuth && session) {
      navigateTo("dashboard");
    }
  }, [session, loadingAuth, navigateTo]);

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setError(
        error.message || "Failed to sign in with Google. Please try again."
      );
    }
  };

  if (loadingAuth) {
    return (
      <div className="text-center text-gray-600">Loading authentication...</div>
    );
  }

  return (
    <div className="text-center py-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Login</h2>
      <p className="mb-8 text-gray-600">
        Sign in with your Google account to create and manage surveys.
      </p>
      <button
        onClick={handleGoogleSignIn}
        className="bg-blue-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center mx-auto space-x-3"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.5 20H24V28H35.5C34.7 31.3 32.5 33.7 29.5 35.3C26.5 36.9 23 37.8 19 37.8C10.2 37.8 2.8 30.5 2.8 21.8C2.8 13.1 10.2 5.8 19 5.8C23.6 5.8 27.5 7.6 30.5 10.4L36.3 4.6C32.1 0.7 25.8 -0.2 19 0.2C8.7 0.2 0 8.7 0 21.8C0 34.9 8.7 43.4 19 43.4C29 43.4 36.7 38.3 36.7 28.5V20H44.5Z"
            fill="#4285F4"
          />
          <path
            d="M19 43.4C26.5 43.4 32.7 39.4 35.8 33.7L29.5 28C27.5 31.7 23.6 34.2 19 34.2C13.2 34.2 8.3 30.2 6.5 24.9L0.7 29.7C3.1 36.4 10.5 43.4 19 43.4Z"
            fill="#34A853"
          />
          <path
            d="M19 5.8C23.6 5.8 27.5 7.6 30.5 10.4L36.3 4.6C32.1 0.7 25.8 -0.2 19 0.2C8.7 0.2 0 8.7 0 21.8H6.5C8.3 16.5 13.2 12.5 19 12.5C22.4 12.5 25.4 13.4 27.9 15.1L30.7 12.3C27.3 9.4 23.4 7.8 19 7.8V5.8Z"
            fill="#FBBC05"
          />
          <path
            d="M44.5 20H24V28H35.5C34.7 31.3 32.5 33.7 29.5 35.3C26.5 36.9 23 37.8 19 37.8C10.2 37.8 2.8 30.5 2.8 21.8C2.8 13.1 10.2 5.8 19 5.8C23.6 5.8 27.5 7.6 30.5 10.4L36.3 4.6C32.1 0.7 25.8 -0.2 19 0.2C8.7 0.2 0 8.7 0 21.8C0 34.9 8.7 43.4 19 43.4Z"
            fill="#EA4335"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default LoginPage;
