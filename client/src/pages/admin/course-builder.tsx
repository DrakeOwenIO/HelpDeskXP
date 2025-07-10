import { useState, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Edit, Trash2, Save, GripVertical, Play, FileText, Video, CheckCircle, HelpCircle, Target } from "lucide-react";
import { Link } from "wouter";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  contentType: 'text' | 'video' | 'quiz';
  orderIndex: number;
  isPublished: boolean;
  videoUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  type: 'lesson_quiz' | 'module_test';
  passingScore: number;
  isPublished: boolean;
  lessonId?: number;
  moduleId?: number;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswers: string[];
  points: number;
  orderIndex: number;
}

interface CourseStructure {
  course: {
    id: number;
    title: string;
    description: string;
    status: string;
  };
  modules: (CourseModule & {
    lessons: Lesson[];
  })[];
}

// Draggable lesson component
interface DraggableLessonProps {
  lesson: Lesson;
  index: number;
  moduleId: number;
  courseId: string;
  moveLesson: (moduleId: number, dragIndex: number, hoverIndex: number) => void;
  getContentTypeIcon: (contentType: string) => JSX.Element;
  onDelete: (lessonId: number) => void;
  onCreateQuiz: (lesson: Lesson) => void;
}

const DraggableLesson = ({ lesson, index, moduleId, courseId, moveLesson, getContentTypeIcon, onDelete, onCreateQuiz }: DraggableLessonProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'lesson',
    item: () => ({ id: lesson.id, index, moduleId }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'lesson',
    hover: (item: { id: number; index: number; moduleId: number }) => {
      if (!item) return;
      if (item.moduleId !== moduleId) return; // Only allow reordering within the same module
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      moveLesson(moduleId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between p-3 bg-neutral-50 rounded-md cursor-move transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <GripVertical className="w-4 h-4 text-neutral-400" />
        {getContentTypeIcon(lesson.contentType)}
        <div>
          <p className="font-medium">{index + 1}. {lesson.title}</p>
          <p className="text-sm text-neutral-600">{lesson.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={lesson.isPublished ? 'default' : 'secondary'} className="text-xs">
          {lesson.isPublished ? 'Published' : 'Draft'}
        </Badge>
        <Link href={`/admin/course-builder/${courseId}/lesson/${lesson.id}`}>
          <Button variant="ghost" size="sm">
            <Edit className="w-3 h-3" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => onDelete(lesson.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onCreateQuiz(lesson)}>
          <HelpCircle className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  
  // Module editing form state
  const [moduleEditForm, setModuleEditForm] = useState({
    title: "",
    description: "",
    isPublished: false,
  });
  
  // Quiz/Test management state
  const [createQuizOpen, setCreateQuizOpen] = useState(false);
  const [editQuizOpen, setEditQuizOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    type: "lesson_quiz" as "lesson_quiz" | "module_test",
    lessonId: null as number | null,
    moduleId: null as number | null,
    passingScore: 80,
  });

  const { data: courseStructure, isLoading, error } = useQuery<CourseStructure>({
    queryKey: [`/api/admin/courses/${courseId}/structure`],
    enabled: !!courseId,
    retry: false,
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: { title: string; description: string }) => {
      return await apiRequest('POST', `/api/admin/courses/${courseId}/modules`, moduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      setNewModuleTitle("");
      toast({
        title: "Module Created",
        description: "New module has been added to the course.",
      });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: { moduleId: number; title: string; description: string; contentType: string }) => {
      return await apiRequest('POST', `/api/admin/courses/${courseId}/lessons`, lessonData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      setNewLessonTitle("");
      setSelectedModuleId(null);
      toast({
        title: "Lesson Created",
        description: "New lesson has been added to the module.",
      });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: number; data: Partial<CourseModule> }) => {
      return await apiRequest('PUT', `/api/admin/courses/${courseId}/modules/${moduleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      // Invalidate course preview to refresh status badges
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/preview`] });
      setEditingModule(null);
      toast({
        title: "Module Updated",
        description: "Module has been updated successfully.",
      });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: number; data: Partial<Lesson> }) => {
      return await apiRequest('PUT', `/api/admin/courses/${courseId}/lessons/${lessonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      setEditingLesson(null);
      toast({
        title: "Lesson Updated",
        description: "Lesson has been updated successfully.",
      });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      return await apiRequest('DELETE', `/api/admin/courses/${courseId}/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      toast({
        title: "Module Deleted",
        description: "Module has been removed from the course.",
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return await apiRequest('DELETE', `/api/admin/courses/${courseId}/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      toast({
        title: "Lesson Deleted",
        description: "Lesson has been removed from the module.",
      });
    },
  });

  // Lesson reordering mutation
  const reorderLessonsMutation = useMutation({
    mutationFn: async ({ moduleId, lessonOrders }: { moduleId: number; lessonOrders: { id: number; orderIndex: number }[] }) => {
      return await apiRequest('PUT', `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { lessonOrders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      toast({
        title: "Lessons Reordered",
        description: "Lesson order has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reorder lessons.",
        variant: "destructive",
      });
    },
  });

  // Quiz/Test mutations
  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      return await apiRequest('POST', '/api/admin/quizzes', quizData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      setCreateQuizOpen(false);
      setQuizForm({
        title: "",
        description: "",
        type: "lesson_quiz",
        lessonId: null,
        moduleId: null,
        passingScore: 80,
      });
      toast({
        title: "Quiz Created",
        description: "Quiz has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create quiz.",
        variant: "destructive",
      });
    },
  });

  const handleCreateModule = () => {
    if (newModuleTitle.trim()) {
      createModuleMutation.mutate({
        title: newModuleTitle.trim(),
        description: "New module description",
      });
    }
  };

  const handleCreateLesson = () => {
    if (newLessonTitle.trim() && selectedModuleId) {
      createLessonMutation.mutate({
        moduleId: selectedModuleId,
        title: newLessonTitle.trim(),
        description: "New lesson description",
        contentType: 'text',
      });
    }
  };

  const handleEditModule = (module: CourseModule) => {
    setModuleEditForm({
      title: module.title,
      description: module.description,
      isPublished: module.isPublished,
    });
    setEditingModule(module.id);
  };

  const handleUpdateModule = () => {
    if (editingModule && moduleEditForm.title.trim()) {
      updateModuleMutation.mutate({
        moduleId: editingModule,
        data: {
          title: moduleEditForm.title.trim(),
          description: moduleEditForm.description.trim(),
          isPublished: moduleEditForm.isPublished,
        }
      });
    }
  };

  const handleCancelModuleEdit = () => {
    setEditingModule(null);
    setModuleEditForm({
      title: "",
      description: "",
      isPublished: false,
    });
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'quiz':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const moveLesson = useCallback((moduleId: number, dragIndex: number, hoverIndex: number) => {
    const module = courseStructure?.modules.find(m => m.id === moduleId);
    if (!module) return;

    const dragLesson = module.lessons[dragIndex];
    const newLessons = [...module.lessons];
    newLessons.splice(dragIndex, 1);
    newLessons.splice(hoverIndex, 0, dragLesson);

    // Update order indices and send to backend
    const lessonOrders = newLessons.map((lesson, index) => ({
      id: lesson.id,
      orderIndex: index
    }));

    reorderLessonsMutation.mutate({ moduleId, lessonOrders });
  }, [courseStructure, reorderLessonsMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    console.error('Course builder error:', error);
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Course Builder</h2>
          <p className="text-neutral-600 mb-4">
            {error instanceof Error ? error.message : 'Unable to load course structure'}
          </p>
          <Link href="/admin/courses">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!courseStructure) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <Link href="/admin/courses">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/courses">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{courseStructure.course.title}</h1>
              <p className="text-neutral-600">Course Builder</p>
            </div>
          </div>
          <Badge variant={courseStructure.course.status === 'published' ? 'default' : 'secondary'}>
            {courseStructure.course.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Structure */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {courseStructure.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-neutral-400" />
                        <div>
                          <h3 className="font-semibold">Module {moduleIndex + 1}: {module.title}</h3>
                          <p className="text-sm text-neutral-600">{module.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={module.isPublished ? 'default' : 'secondary'}>
                          {module.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditModule(module)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteModuleMutation.mutate(module.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    {/* Lessons */}
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <DraggableLesson
                          key={lesson.id}
                          lesson={lesson}
                          index={lessonIndex}
                          moduleId={module.id}
                          courseId={courseId!}
                          moveLesson={moveLesson}
                          getContentTypeIcon={getContentTypeIcon}
                          onDelete={(lessonId) => deleteLessonMutation.mutate(lessonId)}
                          onCreateQuiz={(lesson) => {
                            setQuizForm({
                              title: `${lesson.title} Quiz`,
                              description: `Quiz for ${lesson.title}`,
                              type: "lesson_quiz",
                              lessonId: lesson.id,
                              moduleId: null,
                              passingScore: 80,
                            });
                            setCreateQuizOpen(true);
                          }}
                        />
                      ))}
                      
                      {/* Add Lesson and Module Test Buttons */}
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModuleId(module.id)}
                          className="flex-1"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lesson
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuizForm({
                              title: `${module.title} Test`,
                              description: `Module test for ${module.title}`,
                              type: "module_test",
                              lessonId: null,
                              moduleId: module.id,
                              passingScore: 70,
                            });
                            setCreateQuizOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Add Test
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Module Button */}
                <Button
                  onClick={() => setNewModuleTitle("New Module")}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add Module Form */}
            {newModuleTitle && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Module title"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateModule}
                      disabled={createModuleMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Module
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setNewModuleTitle("")}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Lesson Form */}
            {selectedModuleId && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Lesson</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Lesson title"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateLesson}
                      disabled={createLessonMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Lesson
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedModuleId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Total Modules</span>
                    <span className="font-medium">{courseStructure.modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Total Lessons</span>
                    <span className="font-medium">
                      {courseStructure.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Published Modules</span>
                    <span className="font-medium">
                      {courseStructure.modules.filter(m => m.isPublished).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Published Lessons</span>
                    <span className="font-medium">
                      {courseStructure.modules.reduce((acc, mod) => acc + mod.lessons.filter(l => l.isPublished).length, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Course */}
            <Card>
              <CardHeader>
                <CardTitle>Course Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/admin/courses/${courseId}/preview`}>
                  <Button className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Preview Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Module Edit Dialog */}
        <Dialog open={!!editingModule} onOpenChange={(open) => !open && handleCancelModuleEdit()}>
          <DialogContent aria-describedby="module-edit-description">
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
            </DialogHeader>
            <div id="module-edit-description" className="sr-only">
              Edit module title, description and publication status
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="module-title">Module Title</Label>
                <Input
                  id="module-title"
                  value={moduleEditForm.title}
                  onChange={(e) => setModuleEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter module title"
                />
              </div>
              
              <div>
                <Label htmlFor="module-description">Description</Label>
                <Textarea
                  id="module-description"
                  value={moduleEditForm.description}
                  onChange={(e) => setModuleEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter module description"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="module-published"
                  checked={moduleEditForm.isPublished}
                  onChange={(e) => setModuleEditForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="module-published" className="text-sm font-medium">
                  Published (visible to students in course viewer)
                </Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelModuleEdit}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateModule}
                  disabled={updateModuleMutation.isPending || !moduleEditForm.title.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Module
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quiz Creation Dialog */}
        <Dialog open={createQuizOpen} onOpenChange={setCreateQuizOpen}>
          <DialogContent className="max-w-2xl" aria-describedby="quiz-dialog-description">
            <DialogHeader>
              <DialogTitle>
                Create {quizForm.type === 'lesson_quiz' ? 'Quiz' : 'Test'}
              </DialogTitle>
            </DialogHeader>
            <div id="quiz-dialog-description" className="sr-only">
              Create a new {quizForm.type === 'lesson_quiz' ? 'quiz' : 'test'} with custom title, description and passing score
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz-title">Title</Label>
                <Input
                  id="quiz-title"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div>
                <Label htmlFor="quiz-description">Description</Label>
                <Textarea
                  id="quiz-description"
                  value={quizForm.description}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter quiz description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="passing-score">Passing Score (%)</Label>
                <Input
                  id="passing-score"
                  type="number"
                  min="1"
                  max="100"
                  value={quizForm.passingScore}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 80 }))}
                />
                <p className="text-sm text-neutral-600 mt-1">
                  {quizForm.type === 'lesson_quiz' 
                    ? 'Recommended: 80% for lesson quizzes' 
                    : 'Recommended: 70% for module tests'
                  }
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateQuizOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createQuizMutation.mutate(quizForm)}
                  disabled={createQuizMutation.isPending || !quizForm.title.trim()}
                >
                  {createQuizMutation.isPending ? "Creating..." : `Create ${quizForm.type === 'lesson_quiz' ? 'Quiz' : 'Test'}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </DndProvider>
  );
}