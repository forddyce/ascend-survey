import React, { useState, useEffect } from 'react';
import { getSurveyById, submitSurveyAnswers } from '../services/supabaseService';

type SubmissionStatusType = 'idle' | 'success' | 'error';

interface PublicSurveyPageProps extends NavigateProps {
  surveyId: string | null;
}

const PublicSurveyPage: React.FC<PublicSurveyPageProps> = ({ surveyId, navigateTo }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const [submissionState, setSubmissionState] = useState<{
    status: SubmissionStatusType;
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (!surveyId) {
      setLoading(false);
      setPageError('No survey ID provided.');
      return;
    }

    const fetchSurvey = async () => {
      setLoading(true);
      setPageError(null);
      try {
        const data = await getSurveyById(surveyId);

        const now = new Date();
        const expiresAt = new Date(data.expires_at);

        if (now > expiresAt) {
          setPageError('This survey has expired.');
          setSurvey(null);
        } else if (data.current_votes >= data.max_votes) {
          setPageError('This survey has reached its maximum number of votes.');
          setSurvey(null);
        } else {
          setSurvey(data);
          const initialAnswers: { [key: string]: string } = {};
          data.questions.forEach((q) => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
        }
        // eslint-disable-next-line
      } catch (err: any) {
        console.error('Error fetching survey:', err.message);
        if (err.code === 'PGRST116') {
          setPageError('Survey not found.');
        } else {
          setPageError(err.message || 'Failed to load survey.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionState({ status: 'idle', message: '' });

    if (!survey) {
      setSubmissionState({ status: 'error', message: 'Survey not loaded or invalid.' });
      return;
    }

    const allQuestionsAnswered = survey.questions.every((q) => answers[q.id] !== '');
    if (!allQuestionsAnswered) {
      setSubmissionState({
        status: 'error',
        message: 'Please answer all questions before submitting.',
      });
      return;
    }

    if (new Date() > new Date(survey.expires_at) || survey.current_votes >= survey.max_votes) {
      setSubmissionState({
        status: 'error',
        message: 'This survey is no longer accepting submissions.',
      });
      return;
    }

    setSubmissionState({
      status: 'success',
      message: 'Your submission has been recorded successfully! Thank you!',
    });
    setAnswers({});

    try {
      const result = await submitSurveyAnswers(survey.id, answers);

      if (result && result.error) {
        setSubmissionState({ status: 'error', message: result.error });
      }
      // eslint-disable-next-line
    } catch (err: any) {
      console.error('Error submitting survey (backend):', err);
      setSubmissionState({
        status: 'error',
        message: err.message || 'An unexpected error occurred during submission.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
          <p className="text-lg font-semibold text-gray-700">Loading survey...</p>
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{pageError}</p>
          <button
            onClick={() => navigateTo('home')}
            className="mt-6 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition duration-300"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return <div className="text-center py-10 text-gray-600">Survey not available.</div>;
  }

  if (submissionState.status === 'success') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 font-inter">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
          <p className="text-lg text-gray-700 mb-6">{submissionState.message}</p>
          <button
            onClick={() => navigateTo('home')}
            className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition duration-300"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">{survey.title}</h2>
        <p className="text-center text-gray-600 mb-8">Please answer the questions below.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((q) => (
            <div key={q.id} className="p-5 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
              <p className="text-lg font-semibold text-gray-800 mb-3">{q.text}</p>
              <div className="flex flex-col space-y-2">
                {q.options.map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center text-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => handleAnswerChange(q.id, option)}
                      className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500 transition duration-150 ease-in-out rounded-full"
                      required
                    />
                    <span className="ml-3 text-base">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {submissionState.status === 'error' &&
            submissionState.message && ( // Use string literal
              <div className="p-3 rounded-md text-center bg-red-100 text-red-700">
                <span>{submissionState.message}</span>
              </div>
            )}

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={submissionState.status !== 'idle'}
              className={`
                inline-flex items-center px-8 py-4 rounded-full shadow-lg text-white
                transition duration-300 ease-in-out transform hover:scale-105
                ${
                  submissionState.status !== 'idle'
                    ? 'bg-gray-400 cursor-not-allowed opacity-75'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              Submit Survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicSurveyPage;
