import React, { useState, useEffect } from "react";
import SupabaseProvider from "./providers/SupabaseProvider";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import CreateSurveyForm from "./pages/CreateSurvey";
import PublicSurveyPage from "./pages/PublicSurvey";

const App: React.FC = () => {
  const [route, setRoute] = useState<string>("login");
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split("/");
    if (parts[1] === "survey" && parts[2]) {
      setCurrentSurveyId(parts[2]);
      setRoute("survey");
    } else {
      setRoute("login");
    }
  }, []);

  const navigateTo = (newRoute: string, surveyId: string | null = null) => {
    setRoute(newRoute);
    setCurrentSurveyId(surveyId);
    if (newRoute === "survey" && surveyId) {
      window.history.pushState({}, "", `/survey/${surveyId}`);
    } else if (
      newRoute === "dashboard" ||
      newRoute === "create-survey" ||
      newRoute === "login"
    ) {
      window.history.pushState({}, "", "/");
    }
  };

  const renderContent = () => {
    switch (route) {
      case "login":
        return <LoginPage navigateTo={navigateTo} />;
      case "dashboard":
        return <DashboardPage navigateTo={navigateTo} />;
      case "create-survey":
        return <CreateSurveyForm navigateTo={navigateTo} />;
      case "survey":
        return (
          <PublicSurveyPage
            surveyId={currentSurveyId}
            navigateTo={navigateTo}
          />
        );
      default:
        return <LoginPage navigateTo={navigateTo} />;
    }
  };

  return (
    <SupabaseProvider>
      <MainLayout>{renderContent()}</MainLayout>
    </SupabaseProvider>
  );
};

export default App;
