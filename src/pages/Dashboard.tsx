import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { fetchSurveys, signOut } from '../services/supabaseService';

const DashboardPage: React.FC<NavigateProps> = ({ navigateTo }) => {
  const { session, supabase } = useSupabase();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !session.user || !supabase) {
      navigateTo('login');
      return;
    }

    const loadSurveys = async () => {
      setLoadingSurveys(true);
      setError(null);
      try {
        const data = await fetchSurveys(session.user.id);
        setSurveys(data);
        // eslint-disable-next-line
      } catch (err: any) {
        console.error('Error loading surveys:', err.message);
        setError('Failed to load surveys.');
      } finally {
        setLoadingSurveys(false);
      }
    };

    loadSurveys();

    const surveysChannel = supabase
      .channel(`public:surveys:admin_id=eq.${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveys',
          filter: `admin_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log({ payload });
          loadSurveys();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(surveysChannel);
    };
  }, [session, navigateTo, supabase]);

  const handleSignOut = async () => {
    setError('');
    try {
      await signOut();
      navigateTo('login');
      // eslint-disable-next-line
    } catch (error: any) {
      console.error('Sign Out Error:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  if (!session || !session.user) {
    return <div className="text-center text-gray-600">Redirecting to login...</div>;
  }

  const currentUser = session.user;

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Admin Dashboard</h2>
      <p className="text-center text-gray-600 mb-4">
        Logged in as: <span className="font-semibold">{currentUser.email}</span>
        <br />
        Your User ID: <span className="font-mono text-sm">{currentUser.id}</span>
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <button
          onClick={() => navigateTo('create-survey')}
          className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
        >
          Create New Survey
        </button>
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105"
        >
          Sign Out
        </button>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Your Surveys</h3>
      {loadingSurveys ? (
        <p className="text-gray-500 text-center">Loading surveys...</p>
      ) : surveys.length === 0 ? (
        <p className="text-gray-500 text-center">You haven't created any surveys yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-gray-50 p-5 rounded-lg shadow-md border border-gray-200"
            >
              <h4 className="text-xl font-bold mb-2 text-blue-700">{survey.title}</h4>
              <p className="text-sm text-gray-600 mb-1">
                Created: {new Date(survey.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Expires: {new Date(survey.expires_at).toLocaleDateString()}
              </p>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Votes: {survey.current_votes || 0} / {survey.max_votes}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`${window.location.origin}/survey/${survey.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition duration-200"
                >
                  View Public Link
                </a>
                <button
                  onClick={() => navigateTo('survey-results', survey.id)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm hover:bg-purple-600 transition duration-200"
                >
                  View Results
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
