import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizPlayerProps {
  quiz: Quiz;
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnsweredCurrent = selectedAnswers[currentQuestionIndex] !== undefined;

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
      setQuizCompleted(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizCompleted(false);
  };

  const score = calculateScore();
  const passed = score >= quiz.passingScore;

  if (showResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Award className="h-6 w-6" />
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score}%
            </div>
            <p className="text-lg mb-4">
              You got {Object.values(selectedAnswers).filter((answer, index) => 
                answer === quiz.questions[index].correctAnswer
              ).length} out of {quiz.questions.length} questions correct
            </p>
            <Badge variant={passed ? "default" : "destructive"} className="text-sm">
              {passed ? `Passed! (${quiz.passingScore}% required)` : `Failed (${quiz.passingScore}% required)`}
            </Badge>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Review Your Answers:</h3>
            {quiz.questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <p className="font-medium mb-3">{index + 1}. {question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isSelected = userAnswer === optIndex;
                      const isCorrectAnswer = optIndex === question.correctAnswer;
                      
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded border text-sm ${
                            isCorrectAnswer
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : isSelected && !isCorrect
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrectAnswer && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                            {isSelected && !isCorrect && (
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                            )}
                            <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button onClick={handleRetakeQuiz} variant="outline">
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {quiz.title}
          </div>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Badge>
        </CardTitle>
        <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === index;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Passing score: {quiz.passingScore}%
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className="flex items-center gap-2"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}