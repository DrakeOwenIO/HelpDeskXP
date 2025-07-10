import { useState } from "react";
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
import { ArrowLeft, Plus, Edit, Trash2, Save, GripVertical, Play, FileText, Video, CheckCircle } from "lucide-react";
import { Link } from "wouter";

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

export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

  const { data: courseStructure, isLoading } = useQuery<CourseStructure>({
    queryKey: [`/api/admin/courses/${courseId}/structure`],
    enabled: !!courseId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
                          onClick={() => setEditingModule(module.id)}
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
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            {getContentTypeIcon(lesson.contentType)}
                            <div>
                              <p className="font-medium">{lessonIndex + 1}. {lesson.title}</p>
                              <p className="text-sm text-neutral-600">{lesson.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={lesson.isPublished ? 'default' : 'secondary'} className="text-xs">
                              {lesson.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingLesson(lesson.id)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLessonMutation.mutate(lesson.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Lesson Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedModuleId(module.id)}
                        className="w-full mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Lesson
                      </Button>
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
                <Link href={`/courses/${courseId}`}>
                  <Button className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Preview Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}