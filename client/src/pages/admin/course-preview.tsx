import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle2, Play, Clock, FileText, Video, Award, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Link } from "wouter";
import type { Course, CourseModule, CourseLesson } from "@shared/schema";

interface CourseWithContent extends Course {
  modules: (CourseModule & {
    lessons: CourseLesson[];
  })[];
}

export default function CoursePreview() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Fetch course preview content (includes drafts)
  const { data: course, isLoading: courseLoading } = useQuery<CourseWithContent>({
    queryKey: [`/api/admin/courses/${courseId}/preview`],
    enabled: !!courseId && !!user,
  });

  // Auto-select first lesson when course loads
  useEffect(() => {
    if (course && course.modules.length > 0 && course.modules[0].lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(course.modules[0].lessons[0].id);
    }
  }, [course, selectedLessonId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/api/login");
    }
  }, [user, authLoading, setLocation]);

  const selectedLesson = course?.modules
    .flatMap(module => module.lessons)
    .find(lesson => lesson.id === selectedLessonId);

  if (authLoading || courseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
              <Link href="/admin/courses">
                <Button>Back to Course Management</Button>
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
            <Link href={`/admin/course-builder/${courseId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course Builder
              </Button>
            </Link>
            
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <Badge variant="secondary">Preview Mode</Badge>
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {course.title}
            </h1>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Viewing draft content including unpublished modules and lessons
            </p>
          </div>

          {/* Course Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {moduleIndex + 1}. {module.title}
                    </h3>
                    <Badge variant={module.isPublished ? 'default' : 'secondary'} className="text-xs">
                      {module.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 ml-4">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isSelected = lesson.id === selectedLessonId;
                      
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
                              {getContentTypeIcon(lesson.contentType)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                </p>
                                <Badge variant={lesson.isPublished ? 'default' : 'secondary'} className="text-xs">
                                  {lesson.isPublished ? 'Pub' : 'Draft'}
                                </Badge>
                              </div>
                              
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
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedLesson.title}
                      </h1>
                      <Badge variant={selectedLesson.isPublished ? 'default' : 'secondary'}>
                        {selectedLesson.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
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
                    
                    <Link href={`/admin/lesson-editor/${courseId}/${selectedLesson.id}`}>
                      <Button variant="outline" size="sm">
                        Edit Lesson
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
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
                <p className="text-gray-500">Select a lesson to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}