import React, { useState, useEffect } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { createSurvey } from "../services/supabaseService";

const CreateSurveyForm: React.FC<NavigateProps> = ({ navigateTo }) => {
  const { session } = useSupabase();
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", text: "", options: ["Yes", "No"] },
    { id: "q2", text: "", options: ["Yes", "No"] },
    { id: "q3", text: "", options: ["Yes", "No"] },
  ]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    if (!session || !session.user) {
      navigateTo("login");
    }
  }, [session, navigateTo]);

  const handleQuestionTextChange = (index: number, value: string) => {
    const newQuestions: Question[] = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !session.user) {
      setMessage("You must be logged in to create a survey.");
      setMessageType("error");
      return;
    }

    if (!title.trim()) {
      setMessage("Survey title cannot be empty.");
      setMessageType("error");
      return;
    }

    const allQuestionsFilled = questions.every((q) => q.text.trim() !== "");
    if (!allQuestionsFilled) {
      setMessage("All three questions must have text.");
      setMessageType("error");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const createdSurvey = await createSurvey(
        session.user.id,
        title,
        questions
      );
      setMessage(
        `Survey "${createdSurvey.title}" created successfully! Public link: ${createdSurvey.public_link}`
      );
      setMessageType("success");
      setTitle("");
      setQuestions([
        { id: "q1", text: "", options: ["Yes", "No"] },
        { id: "q2", text: "", options: ["Yes", "No"] },
        { id: "q3", text: "", options: ["Yes", "No"] },
      ]);
    } catch (error: any) {
      console.error("Error creating survey:", error);
      setMessage(error.message || "Failed to create survey. Please try again.");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Create New Survey
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="survey-title"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Survey Title
          </label>
          <input
            type="text"
            id="survey-title"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-base"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Customer Satisfaction Survey"
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">
            Questions (Yes/No)
          </h3>
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="p-4 border border-gray-200 rounded-md bg-gray-50"
            >
              <label
                htmlFor={`question-${index}`}
                className="block text-base font-medium text-gray-700 mb-2"
              >
                Question {index + 1}
              </label>
              <input
                type="text"
                id={`question-${index}`}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-base"
                value={q.text}
                onChange={(e) =>
                  handleQuestionTextChange(index, e.target.value)
                }
                placeholder={`Enter question ${index + 1} text`}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Options: Yes / No (fixed)
              </p>
            </div>
          ))}
        </div>

        {message && (
          <div
            className={`p-3 rounded-md ${
              messageType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigateTo("dashboard")}
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-full shadow-lg hover:bg-gray-400 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving Survey..." : "Save Survey"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSurveyForm;
