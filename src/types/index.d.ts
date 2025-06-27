interface Question {
  id: string;
  text: string;
  options: string[];
}

interface Survey {
  id: string;
  admin_id: string;
  title: string;
  questions: Question[];
  created_at: string;
  expires_at: string;
  max_votes: number;
  current_votes: number;
  public_link?: string;
}

interface Submission {
  id: string;
  survey_id: string;
  submitted_at: string;
  answers: { [questionId: string]: string };
  submitter_ip?: string;
}

interface NavigateProps {
  navigateTo: (route: string, surveyId?: string | null) => void;
}

interface PublicSurveyPageProps extends NavigateProps {
  surveyId: string | null;
}
