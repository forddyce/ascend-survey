CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_votes INTEGER NOT NULL DEFAULT 100,
    current_votes INTEGER NOT NULL DEFAULT 0,
    public_link TEXT,
    CONSTRAINT title_length CHECK (LENGTH(title) > 0)
);

CREATE INDEX idx_surveys_admin_id ON public.surveys (admin_id);
CREATE INDEX idx_surveys_expires_at ON public.surveys (expires_at);

CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitter_ip INET
);

CREATE INDEX idx_submissions_survey_id ON public.submissions (survey_id);
CREATE INDEX idx_submissions_submitted_at ON public.submissions (submitted_at);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public surveys viewable if active" ON public.surveys
  FOR SELECT USING (
    expires_at > NOW() AND current_votes < max_votes
  );

CREATE POLICY "Admins can view their own surveys" ON public.surveys
  FOR SELECT TO authenticated USING (auth.uid() = admin_id);

CREATE POLICY "Admins can create their own surveys" ON public.surveys
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their own surveys" ON public.surveys
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their own surveys" ON public.surveys
  FOR DELETE USING (auth.uid() = admin_id);

CREATE POLICY "Anyone can submit to a survey" ON public.submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view submissions for their surveys" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.surveys
      WHERE surveys.id = submissions.survey_id AND surveys.admin_id = auth.uid()
    )
  );

-- update for submit survey

CREATE OR REPLACE FUNCTION public.submit_survey_response(
    p_survey_id UUID,
    p_answers JSONB
)
RETURNS JSON AS $$
DECLARE
    v_survey_exists BOOLEAN;
    v_expired BOOLEAN;
    v_max_votes INTEGER;
    v_current_votes INTEGER;
    v_title TEXT;
    v_result JSONB;
BEGIN
    SELECT
        EXISTS(SELECT 1 FROM public.surveys WHERE id = p_survey_id),
        expires_at < NOW(),
        max_votes,
        current_votes,
        title
    INTO
        v_survey_exists,
        v_expired,
        v_max_votes,
        v_current_votes,
        v_title
    FROM public.surveys
    WHERE id = p_survey_id
    FOR UPDATE;

    IF NOT v_survey_exists THEN
        RETURN json_build_object('success', FALSE, 'message', 'Survey not found.');
    END IF;

    IF v_expired THEN
        RETURN json_build_object('success', FALSE, 'message', 'This survey has expired.');
    END IF;

    IF v_current_votes >= v_max_votes THEN
        RETURN json_build_object('success', FALSE, 'message', 'This survey has reached its maximum number of votes.');
    END IF;

    UPDATE public.surveys
    SET current_votes = current_votes + 1
    WHERE id = p_survey_id;

    INSERT INTO public.submissions (survey_id, answers, submitted_at)
    VALUES (p_survey_id, p_answers, NOW());

    RETURN json_build_object('success', TRUE, 'message', 'Survey submitted successfully.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;