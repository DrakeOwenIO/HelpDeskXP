import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle2, Play, Clock, FileText, Video, Award, ChevronLeft, ChevronRight, HelpCircle, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import type { Course, CourseModule, CourseLesson, UserLessonProgress } from "@shared/schema";

interface CourseWithContent extends Course {
  modules: (CourseModule & {
    lessons: CourseLesson[];
  })[];
}

interface EnrollmentData {
  id: number;
  userId: string;
  courseId: number;
  progress: number;
  completed: boolean;
  enrolledAt: string;
}

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

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [quizResults, setQuizResults] = useState<{ [lessonId: number]: { [quizId: string]: { passed: boolean; score: number } } }>({});

  // Fetch course content with modules and lessons
  const { data: course, isLoading: courseLoading } = useQuery<CourseWithContent>({
    queryKey: ['/api/courses', courseId, 'viewer'],
    enabled: !!courseId && !!user,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  // Check if user has access to this course
  const { data: hasAccess, isLoading: accessLoading } = useQuery<boolean>({
    queryKey: ['/api/user/course-access', courseId],
    enabled: !!courseId && !!user,
  });

  // Get user enrollment and progress
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<EnrollmentData>({
    queryKey: ['/api/user/enrollments', courseId],
    enabled: !!courseId && !!user && hasAccess,
    retry: false,
  });

  // Mutation to update lesson progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ lessonId, isCompleted }: { lessonId: number; isCompleted: boolean }) => {
      return await apiRequest('POST', `/api/lessons/${lessonId}/progress`, { isCompleted });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/enrollments', courseId] });
      
      // Update local state
      setCompletedLessons(prev => {
        const newSet = new Set(prev);
        if (variables.isCompleted) {
          newSet.add(variables.lessonId);
        } else {
          newSet.delete(variables.lessonId);
        }
        return newSet;
      });
      
      toast({
        title: variables.isCompleted ? "Lesson Completed" : "Progress Updated",
        description: variables.isCompleted 
          ? "Great job! Keep up the good work." 
          : "Progress saved successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Find the currently selected lesson
  const selectedLesson = course?.modules
    .flatMap(module => module.lessons)
    .find(lesson => lesson.id === selectedLessonId);

  // Auto-select first lesson if none selected
  useEffect(() => {
    if (course && !selectedLessonId) {
      const firstLesson = course.modules[0]?.lessons[0];
      if (firstLesson) {
        setSelectedLessonId(firstLesson.id);
      }
    }
  }, [course, selectedLessonId]);

  // Loading states
  if (authLoading || courseLoading || accessLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>You need to purchase this course to access the content.</p>
              <Link href={`/courses/${courseId}`}>
                <Button>Go to Course Details</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Course Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>The course you're looking for doesn't exist.</p>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to check if all quizzes in a lesson are passed
  const areAllQuizzesPassed = (lesson: CourseLesson) => {
    if (!lesson.contentBlocks) return true; // No quizzes to check
    
    const quizBlocks = lesson.contentBlocks.filter(block => block.type === 'quiz');
    if (quizBlocks.length === 0) return true; // No quizzes in this lesson
    
    const lessonQuizResults = quizResults[lesson.id] || {};
    return quizBlocks.every(quizBlock => 
      lessonQuizResults[quizBlock.id]?.passed === true
    );
  };

  const allLessons = course.modules.flatMap(module => module.lessons);
  const currentLessonIndex = allLessons.findIndex(lesson => lesson.id === selectedLessonId);
  const canGoPrevious = currentLessonIndex > 0;
  
  // Can only go to next lesson if current lesson has all quizzes passed
  const currentLesson = selectedLesson;
  const canGoNext = currentLessonIndex < allLessons.length - 1 && 
    (currentLesson ? areAllQuizzesPassed(currentLesson) : true);

  // Handler for quiz completion
  const handleQuizComplete = (quizId: string, passed: boolean, score: number) => {
    if (!selectedLessonId) return;
    
    setQuizResults(prev => ({
      ...prev,
      [selectedLessonId]: {
        ...prev[selectedLessonId],
        [quizId]: { passed, score }
      }
    }));
  };

  const handlePreviousLesson = () => {
    if (canGoPrevious) {
      setSelectedLessonId(allLessons[currentLessonIndex - 1].id);
    }
  };

  const handleNextLesson = () => {
    if (!selectedLesson) return;
    
    if (!areAllQuizzesPassed(selectedLesson)) {
      toast({
        title: "Quiz Required",
        description: "Please complete all quizzes with 80% or higher before proceeding to the next lesson.",
        variant: "destructive",
      });
      return;
    }
    
    if (canGoNext) {
      setSelectedLessonId(allLessons[currentLessonIndex + 1].id);
    }
  };

  const handleCompleteLesson = () => {
    if (selectedLessonId) {
      const isCurrentlyCompleted = completedLessons.has(selectedLessonId);
      updateProgressMutation.mutate({
        lessonId: selectedLessonId,
        isCompleted: !isCurrentlyCompleted,
      });
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <Award className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Course Navigation */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Course Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Link href={`/courses/${courseId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
            
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {course.title}
            </h1>
            
            {enrollment && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Course Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id}>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {moduleIndex + 1}. {module.title}
                  </h3>
                  
                  <div className="space-y-1 ml-4">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isSelected = lesson.id === selectedLessonId;
                      const isCompleted = completedLessons.has(lesson.id);
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                getContentTypeIcon(lesson.contentType)
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                              }`}>
                                {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                              </p>
                              
                              {lesson.duration && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{lesson.duration} min</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {moduleIndex < course.modules.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedLesson ? (
            <>
              {/* Lesson Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedLesson.title}
                    </h1>
                    {selectedLesson.description && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedLesson.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedLesson.contentType === 'video' ? 'default' : 'secondary'}>
                      {selectedLesson.contentType}
                    </Badge>
                    
                    <Button
                      onClick={handleCompleteLesson}
                      variant={completedLessons.has(selectedLesson.id) ? "secondary" : "default"}
                      disabled={updateProgressMutation.isPending}
                    >
                      {completedLessons.has(selectedLesson.id) ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        "Mark Complete"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  {/* Debug info - remove this once working */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p><strong>Debug Course Structure:</strong></p>
                      <p><strong>Modules found:</strong> {course.modules.length}</p>
                      {course.modules.length === 0 && (
                        <p className="text-red-600 font-medium">⚠️ No published modules found! Module must be published for lessons to appear.</p>
                      )}
                      {selectedLesson && (
                        <>
                          <p><strong>Selected Lesson:</strong> "{selectedLesson.title}" (ID: {selectedLesson.id})</p>
                          <p><strong>Published:</strong> {selectedLesson.isPublished ? 'Yes' : 'No'}</p>
                          <p><strong>Content Blocks:</strong> {selectedLesson.contentBlocks?.length || 0}</p>
                          {selectedLesson.contentBlocks?.map((block, i) => (
                            <p key={i}>Block {i + 1}: {block.type} (quiz data: {block.type === 'quiz' ? (block.quiz ? 'present' : 'missing') : 'n/a'})</p>
                          ))}
                          <p><strong>Content Type:</strong> {selectedLesson.contentType}</p>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* TEST QUIZ - remove this once working */}
                  {process.env.NODE_ENV === 'development' && selectedLesson.id === 1 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Test Quiz (Development Only)</h3>
                      <QuizPlayer 
                        quiz={{
                          title: "Test Quiz",
                          passingScore: 80,
                          questions: [
                            {
                              id: "1",
                              question: "What is the keyboard shortcut to open Task Manager?",
                              options: ["Ctrl+Alt+Del", "Ctrl+Shift+Esc", "Alt+Tab", "Ctrl+Alt+T"],
                              correctAnswer: 1
                            },
                            {
                              id: "2", 
                              question: "Which component typically causes boot failures?",
                              options: ["RAM", "Hard Drive", "Power Supply", "All of the above"],
                              correctAnswer: 3
                            }
                          ]
                        }}
                        onQuizComplete={(passed, score) => handleQuizComplete("test-quiz-1", passed, score)}
                      />
                    </div>
                  )}
                  
                  {/* Render content blocks if they exist */}
                  {selectedLesson.contentBlocks && selectedLesson.contentBlocks.length > 0 ? (
                    <div className="space-y-6">
                      {selectedLesson.contentBlocks
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((block) => (
                          <div key={block.id} className="content-block">
                            {block.type === 'text' && (
                              <div className="prose prose-lg dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: block.content }} />
                              </div>
                            )}
                            {block.type === 'image' && (
                              <div className="flex justify-center">
                                <img
                                  src={block.content}
                                  alt={block.metadata?.alt || 'Lesson image'}
                                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                              </div>
                            )}
                            {block.type === 'video' && (
                              <div className="mb-8">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                  <video
                                    className="w-full h-full"
                                    controls
                                    src={block.content}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              </div>
                            )}
                            {block.type === 'quiz' && block.quiz && (
                              <QuizPlayer 
                                quiz={block.quiz} 
                                onQuizComplete={(passed, score) => handleQuizComplete(block.id, passed, score)}
                              />
                            )}
                            {block.type === 'quiz' && !block.quiz && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-600">Quiz data is missing for this quiz block</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    // Fallback to old content structure
                    <>
                      {selectedLesson.contentType === 'video' && selectedLesson.videoUrl ? (
                        <div className="mb-6">
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                              className="w-full h-full"
                              controls
                              src={selectedLesson.videoUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>
                      ) : selectedLesson.contentType === 'video' ? (
                        <div className="mb-6">
                          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Video content will be available soon</p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {selectedLesson.content && (
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                        </div>
                      )}

                      {!selectedLesson.content && selectedLesson.contentType !== 'video' && (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Content for this lesson is being prepared.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousLesson}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous Lesson
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Lesson {currentLessonIndex + 1} of {allLessons.length}
                    </div>
                    {currentLesson && !areAllQuizzesPassed(currentLesson) && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Complete all quizzes to proceed
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleNextLesson}
                    disabled={!canGoNext}
                    variant={currentLesson && !areAllQuizzesPassed(currentLesson) ? "outline" : "default"}
                  >
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a lesson to start learning</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quiz Player Component
function QuizPlayer({ quiz, onQuizComplete }: { quiz: Quiz; onQuizComplete?: (passed: boolean, score: number) => void }) {
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
      
      // Calculate final score and call callback
      const finalScore = calculateScore();
      const finalPassed = finalScore >= quiz.passingScore;
      if (onQuizComplete) {
        onQuizComplete(finalPassed, finalScore);
      }
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
                          className={`p-2 rounded border ${
                            isCorrectAnswer
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : isSelected && !isCorrect
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isCorrectAnswer 
                                ? 'bg-green-500' 
                                : isSelected 
                                ? 'bg-red-500' 
                                : 'bg-gray-300'
                            }`} />
                            <span>{option}</span>
                            {isCorrectAnswer && <span className="text-xs font-medium">(Correct)</span>}
                            {isSelected && !isCorrect && <span className="text-xs font-medium">(Your answer)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!passed && (
            <div className="text-center">
              <Button onClick={handleRetakeQuiz} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {quiz.title}
          </CardTitle>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%</span>
          </div>
          <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnswers[currentQuestionIndex] === index
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers[currentQuestionIndex] === index && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next'}
            {!isLastQuestion && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}