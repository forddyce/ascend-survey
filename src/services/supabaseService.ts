import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check environment variables.');
}

export const supabase: SupabaseClient | undefined =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : undefined;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Check environment variables.');
  }
  return supabase;
};

export const signInWithGoogle = async () => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async (): Promise<void> => {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const fetchSurveys = async (adminId: string): Promise<Survey[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('surveys')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Survey[];
};

export const createSurvey = async (
  adminId: string,
  title: string,
  questions: Question[],
): Promise<Survey> => {
  const client = getSupabaseClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const newSurveyData = {
    admin_id: adminId,
    title: title.trim(),
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text.trim(),
      options: q.options,
    })),
    expires_at: expiresAt.toISOString(),
    max_votes: 100,
    current_votes: 0,
  };

  const { data, error } = await client.from('surveys').insert([newSurveyData]).select();

  if (error) throw error;

  const createdSurvey = data[0] as Survey;
  const publicLink = `${window.location.origin}/survey/${createdSurvey.id}`;

  const { error: updateError } = await client
    .from('surveys')
    .update({ public_link: publicLink })
    .eq('id', createdSurvey.id);

  if (updateError) throw updateError;

  return { ...createdSurvey, public_link: publicLink };
};

export const getSurveyById = async (surveyId: string): Promise<Survey> => {
  const client = getSupabaseClient();
  const { data, error } = await client.from('surveys').select('*').eq('id', surveyId).single();

  if (error) throw error;
  return data as Survey;
};

export const submitSurveyAnswers = async (
  surveyId: string,
  answers: { [questionId: string]: string },
  // eslint-disable-next-line
): Promise<any> => {
  const client = getSupabaseClient();
  const { data, error } = await client.functions.invoke('submit-survey', {
    body: {
      surveyId: surveyId,
      answers: answers,
    },
  });

  if (error) throw error;
  return data;
};
