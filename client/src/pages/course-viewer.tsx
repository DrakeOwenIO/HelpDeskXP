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
import { ArrowLeft, CheckCircle2, Play, Clock, FileText, Video, Award, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // Fetch course content with modules and lessons
  const { data: course, isLoading: courseLoading } = useQuery<CourseWithContent>({
    queryKey: ['/api/courses', courseId, 'viewer'],
    enabled: !!courseId && !!user,
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

  const allLessons = course.modules.flatMap(module => module.lessons);
  const currentLessonIndex = allLessons.findIndex(lesson => lesson.id === selectedLessonId);
  const canGoPrevious = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex < allLessons.length - 1;

  const handlePreviousLesson = () => {
    if (canGoPrevious) {
      setSelectedLessonId(allLessons[currentLessonIndex - 1].id);
    }
  };

  const handleNextLesson = () => {
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
                  
                  <Button
                    onClick={handleNextLesson}
                    disabled={!canGoNext}
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