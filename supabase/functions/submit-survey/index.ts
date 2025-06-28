import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts';

console.log(`Function "submit-survey" up and running!`);

const REDIS_URL = Deno.env.get('REDIS_URL');
const REDIS_TOKEN = Deno.env.get('REDIS_TOKEN');

let redisClient: Redis | null = null;

async function getRedisClient() {
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.error(
      'Upstash Redis environment variables (REDIS_URL, REDIS_TOKEN) are not set. Rate limiting will be skipped.',
    );
    return null;
  }
  if (!redisClient) {
    console.time('Redis_Connect');
    try {
      redisClient = new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      });
      console.log('Successfully connected to Upstash Redis!');
    } catch (error) {
      console.error('Failed to connect to Upstash Redis:', (error as Error).message);
      redisClient = null;
    } finally {
      console.timeEnd('Redis_Connect');
    }
  }
  return redisClient;
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 5;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { 'x-ascend-header': 'survey-app-edge-function' },
      },
    },
  );

  try {
    const { surveyId, answers } = await req.json();

    if (!surveyId || !answers || Object.keys(answers).length === 0) {
      return new Response(JSON.stringify({ error: 'Missing surveyId or answers.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const clientIp =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
    const rateLimitKey = `survey_submit_limit:${clientIp}`;
    const redis = await getRedisClient();

    if (redis) {
      console.time('Redis_IncrExpire');
      const currentRequests = await redis.incr(rateLimitKey);
      if (currentRequests === 1) {
        await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
      }
      console.timeEnd('Redis_IncrExpire');

      if (currentRequests > MAX_REQUESTS_PER_WINDOW) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          },
        );
      }
    } else {
      console.warn('Redis client not available. Skipping rate limiting.');
    }

    console.time('DB_SurveySelect');
    const { data: survey, error: surveyError } = await supabaseClient
      .from('surveys')
      .select('expires_at, max_votes, current_votes')
      .eq('id', surveyId)
      .single();
    console.timeEnd('DB_SurveySelect');

    if (surveyError || !survey) {
      console.error(
        'Error fetching survey for submission:',
        surveyError?.message || 'Survey not found.',
      );
      return new Response(JSON.stringify({ error: 'Survey not found or an error occurred.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const now = new Date();
    const expiresAt = new Date(survey.expires_at);

    if (now > expiresAt) {
      return new Response(JSON.stringify({ error: 'This survey has expired.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (survey.current_votes >= survey.max_votes) {
      return new Response(
        JSON.stringify({
          error: 'This survey has reached its maximum number of votes.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    console.time('DB_RPC_submit_survey_response');
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('submit_survey_response', {
      p_survey_id: surveyId,
      p_answers: answers,
    });
    console.timeEnd('DB_RPC_submit_survey_response');

    if (rpcError) {
      console.error('Error calling RPC function:', rpcError);
      return new Response(
        JSON.stringify({
          error: rpcError.message || 'Failed to record submission atomically.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    if (rpcData.success === false) {
      return new Response(
        JSON.stringify({
          error: rpcData.message || 'Submission failed due to survey state.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    return new Response(JSON.stringify({ message: 'Survey submitted successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Submit survey function error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
