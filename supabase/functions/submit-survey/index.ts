import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { "x-ascend-header": "survey-app-edge-function" },
      },
    }
  );

  try {
    const { surveyId, answers } = await req.json();

    if (!surveyId || !answers || Object.keys(answers).length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing surveyId or answers." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { data: survey, error: surveyError } = await supabaseClient
      .from("surveys")
      .select("expires_at, max_votes, current_votes")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      console.error(
        "Error fetching survey for submission:",
        surveyError?.message || "Survey not found."
      );
      return new Response(
        JSON.stringify({ error: "Survey not found or an error occurred." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(survey.expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: "This survey has expired." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    if (survey.current_votes >= survey.max_votes) {
      return new Response(
        JSON.stringify({
          error: "This survey has reached its maximum number of votes.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
      "submit_survey_response",
      {
        p_survey_id: surveyId,
        p_answers: answers,
      }
    );

    if (rpcError) {
      console.error("Error calling RPC function:", rpcError);
      return new Response(
        JSON.stringify({
          error: rpcError.message || "Failed to record submission atomically.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (rpcData.success === false) {
      return new Response(
        JSON.stringify({
          error: rpcData.message || "Submission failed due to survey state.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Survey submitted successfully!" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Submit survey function error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
