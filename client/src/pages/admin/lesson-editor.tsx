import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Upload, 
  Image, 
  Video, 
  FileText, 
  GripVertical,
  Eye,
  Settings,
  HelpCircle,
  Check
} from "lucide-react";
import { Link } from "wouter";

interface LessonContent {
  id: string;
  type: 'text' | 'video' | 'image' | 'quiz';
  content: string;
  orderIndex: number;
  metadata?: {
    filename?: string;
    size?: number;
    duration?: number;
    alt?: string;
  };
  quiz?: {
    title: string;
    questions: QuizQuestion[];
    passingScore: number;
  };
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  contentType: string;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPublished: boolean;
  orderIndex: number;
  moduleId: number;
  createdAt: string;
  updatedAt: string;
  contentBlocks?: LessonContent[];
}

export default function LessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [editingContent, setEditingContent] = useState<LessonContent | null>(null);
  const [newContentType, setNewContentType] = useState<'text' | 'video' | 'image'>('text');
  const [showAddContent, setShowAddContent] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<LessonContent | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    questions: [] as QuizQuestion[],
    passingScore: 80
  });
  const [lessonSettings, setLessonSettings] = useState({
    title: "",
    description: "",
    contentType: "text" as string,
    isPublished: false,
  });

  // Fetch lesson data
  const { data: lesson, isLoading, error } = useQuery<Lesson>({
    queryKey: [`/api/admin/courses/${courseId}/lessons/${lessonId}`],
    enabled: !!courseId && !!lessonId,
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (data: Partial<Lesson>) => {
      return await apiRequest('PUT', `/api/admin/courses/${courseId}/lessons/${lessonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/lessons/${lessonId}`] });
      // Also invalidate course structure to refresh lesson status in course builder
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/structure`] });
      // Invalidate course preview to refresh status badges
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/preview`] });
      toast({
        title: "Lesson Updated",
        description: "Lesson has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update lesson.",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const newContent: LessonContent = {
        id: Date.now().toString(),
        type: data.type === 'video' ? 'video' : 'image',
        content: data.url,
        orderIndex: (lesson?.contentBlocks?.length || 0),
        metadata: {
          filename: data.filename,
          size: data.size,
        }
      };
      
      const updatedBlocks = [...(lesson?.contentBlocks || []), newContent];
      updateLessonMutation.mutate({ 
        contentBlocks: updatedBlocks 
      });
      
      toast({
        title: "File Uploaded",
        description: `${data.type === 'video' ? 'Video' : 'Image'} has been added to the lesson.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (type: 'image' | 'video') => {
    const input = type === 'video' ? videoInputRef.current : fileInputRef.current;
    if (!input) return;
    
    input.accept = type === 'video' ? 'video/*' : 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Check file size limits
      const maxSize = type === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 500MB for video, 10MB for image
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${type === 'video' ? 'Video' : 'Image'} must be under ${type === 'video' ? '500MB' : '10MB'}.`,
          variant: "destructive",
        });
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('courseId', courseId!);
      
      uploadFileMutation.mutate(formData);
    };
    input.click();
  };

  const addTextContent = (text: string) => {
    const newContent: LessonContent = {
      id: Date.now().toString(),
      type: 'text',
      content: text,
      orderIndex: (lesson?.contentBlocks?.length || 0),
    };
    
    const updatedBlocks = [...(lesson?.contentBlocks || []), newContent];
    updateLessonMutation.mutate({ 
      contentBlocks: updatedBlocks 
    });
    setShowAddContent(false);
  };

  const updateContentBlock = (id: string, content: string) => {
    if (!lesson?.contentBlocks) return;
    
    const updatedBlocks = lesson.contentBlocks.map(block =>
      block.id === id ? { ...block, content } : block
    );
    
    updateLessonMutation.mutate({ 
      contentBlocks: updatedBlocks 
    });
    setEditingContent(null);
  };

  const deleteContentBlock = (id: string) => {
    if (!lesson?.contentBlocks) return;
    
    const updatedBlocks = lesson.contentBlocks
      .filter(block => block.id !== id)
      .map((block, index) => ({ ...block, orderIndex: index }));
    
    updateLessonMutation.mutate({ 
      contentBlocks: updatedBlocks 
    });
  };

  const reorderContent = (fromIndex: number, toIndex: number) => {
    if (!lesson?.contentBlocks) return;
    
    const blocks = [...lesson.contentBlocks];
    const [movedBlock] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, movedBlock);
    
    const reorderedBlocks = blocks.map((block, index) => ({
      ...block,
      orderIndex: index
    }));
    
    updateLessonMutation.mutate({ 
      contentBlocks: reorderedBlocks 
    });
  };

  const updateLessonSettings = () => {
    updateLessonMutation.mutate(lessonSettings);
  };

  // Quiz functions
  const addQuiz = () => {
    const newQuiz: LessonContent = {
      id: Date.now().toString(),
      type: 'quiz',
      content: quizForm.title,
      orderIndex: (lesson?.contentBlocks?.length || 0),
      quiz: {
        title: quizForm.title,
        questions: quizForm.questions,
        passingScore: quizForm.passingScore
      }
    };
    
    const updatedBlocks = [...(lesson?.contentBlocks || []), newQuiz];
    updateLessonMutation.mutate({ 
      contentBlocks: updatedBlocks 
    });
    setShowQuizBuilder(false);
  };

  const updateQuiz = (quizId: string) => {
    if (!lesson?.contentBlocks) return;
    
    const updatedBlocks = lesson.contentBlocks.map(block =>
      block.id === quizId ? {
        ...block,
        content: quizForm.title,
        quiz: {
          title: quizForm.title,
          questions: quizForm.questions,
          passingScore: quizForm.passingScore
        }
      } : block
    );
    
    updateLessonMutation.mutate({ 
      contentBlocks: updatedBlocks 
    });
    setShowQuizBuilder(false);
    setEditingQuiz(null);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson Not Found</h2>
          <Link href={`/admin/course-builder/${courseId}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course Builder
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
            <Link href={`/admin/course-builder/${courseId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Builder
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{lesson.title}</h1>
              <p className="text-neutral-600">Lesson Content Editor</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={lesson.isPublished ? 'default' : 'secondary'}>
              {lesson.isPublished ? 'Published' : 'Draft'}
            </Badge>
            <Button
              onClick={() => {
                setLessonSettings({
                  title: lesson.title,
                  description: lesson.description,
                  contentType: lesson.contentType,
                  isPublished: lesson.isPublished,
                });
              }}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lesson Content</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddContent(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload('image')}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload('video')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Add Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuizForm({ title: '', questions: [], passingScore: 80 });
                        setEditingQuiz(null);
                        setShowQuizBuilder(true);
                      }}
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Add Quiz
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {lesson.contentBlocks && lesson.contentBlocks.length > 0 ? (
                  <div className="space-y-4">
                    {lesson.contentBlocks
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((block, index) => (
                        <div
                          key={block.id}
                          className="border rounded-lg p-4 bg-white relative group"
                          draggable
                          onDragStart={() => setDraggedIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedIndex !== null && draggedIndex !== index) {
                              reorderContent(draggedIndex, index);
                            }
                            setDraggedIndex(null);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <GripVertical className="w-4 h-4 text-neutral-400 mt-1 cursor-move" />
                              <div className="flex-1">
                                {block.type === 'text' && (
                                  <div className="prose max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: block.content }} />
                                  </div>
                                )}
                                {block.type === 'image' && (
                                  <div className="space-y-2">
                                    <img
                                      src={block.content}
                                      alt={block.metadata?.alt || 'Lesson image'}
                                      className="max-w-full h-auto rounded border"
                                    />
                                    <p className="text-sm text-neutral-600">
                                      {block.metadata?.filename}
                                    </p>
                                  </div>
                                )}
                                {block.type === 'video' && (
                                  <div className="space-y-2">
                                    <video
                                      src={block.content}
                                      controls
                                      className="max-w-full h-auto rounded border"
                                    />
                                    <p className="text-sm text-neutral-600">
                                      {block.metadata?.filename}
                                    </p>
                                  </div>
                                )}
                                {block.type === 'quiz' && (
                                  <div className="space-y-3 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-center space-x-2">
                                      <HelpCircle className="w-5 h-5 text-blue-600" />
                                      <h3 className="font-medium text-blue-900">{block.quiz?.title || 'Quiz'}</h3>
                                    </div>
                                    <div className="text-sm text-blue-700">
                                      <p>{block.quiz?.questions.length || 0} questions</p>
                                      <p>Passing score: {block.quiz?.passingScore || 80}%</p>
                                    </div>
                                    <div className="space-y-2">
                                      {block.quiz?.questions.slice(0, 2).map((q, idx) => (
                                        <div key={idx} className="text-sm bg-white p-2 rounded border">
                                          <p className="font-medium">{idx + 1}. {q.question || 'Question text...'}</p>
                                          <div className="mt-1 space-y-1">
                                            {q.options.map((option, optIdx) => (
                                              <div key={optIdx} className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${optIdx === q.correctAnswer ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                <span className={optIdx === q.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                                  {option || `Option ${optIdx + 1}...`}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                      {(block.quiz?.questions.length || 0) > 2 && (
                                        <p className="text-xs text-blue-600">
                                          +{(block.quiz?.questions.length || 0) - 2} more questions...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {block.type === 'text' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingContent(block)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                              {block.type === 'quiz' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setQuizForm({
                                      title: block.quiz?.title || '',
                                      questions: block.quiz?.questions || [],
                                      passingScore: block.quiz?.passingScore || 80
                                    });
                                    setEditingQuiz(block);
                                    setShowQuizBuilder(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteContentBlock(block.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No content yet</p>
                    <p className="mb-4">Start building your lesson by adding content blocks</p>
                    <Button onClick={() => setShowAddContent(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Content Block
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/courses/${courseId}/lessons/${lessonId}`}>
                  <Button className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Lesson
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Content Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Content Blocks</span>
                    <span className="font-medium">{lesson.contentBlocks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Text Blocks</span>
                    <span className="font-medium">
                      {lesson.contentBlocks?.filter(b => b.type === 'text').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Images</span>
                    <span className="font-medium">
                      {lesson.contentBlocks?.filter(b => b.type === 'image').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Videos</span>
                    <span className="font-medium">
                      {lesson.contentBlocks?.filter(b => b.type === 'video').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Quizzes</span>
                    <span className="font-medium">
                      {lesson.contentBlocks?.filter(b => b.type === 'quiz').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Content Dialog */}
        <Dialog open={showAddContent} onOpenChange={setShowAddContent}>
          <DialogContent className="max-w-2xl" aria-describedby="add-content-description">
            <DialogHeader>
              <DialogTitle>Add Text Content</DialogTitle>
            </DialogHeader>
            <div id="add-content-description" className="sr-only">
              Add a new text content block to the lesson
            </div>
            <AddContentForm onAdd={addTextContent} onCancel={() => setShowAddContent(false)} />
          </DialogContent>
        </Dialog>

        {/* Edit Content Dialog */}
        <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
          <DialogContent className="max-w-2xl" aria-describedby="edit-content-description">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
            </DialogHeader>
            <div id="edit-content-description" className="sr-only">
              Edit the selected content block
            </div>
            {editingContent && (
              <EditContentForm 
                content={editingContent} 
                onSave={(content) => updateContentBlock(editingContent.id, content)}
                onCancel={() => setEditingContent(null)} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Lesson Settings Dialog */}
        <Dialog open={!!lessonSettings.title} onOpenChange={() => setLessonSettings({ title: "", description: "", contentType: "text", isPublished: false })}>
          <DialogContent className="max-w-lg" aria-describedby="lesson-settings-description">
            <DialogHeader>
              <DialogTitle>Lesson Settings</DialogTitle>
            </DialogHeader>
            <div id="lesson-settings-description" className="sr-only">
              Configure lesson title, description, type and publishing status
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lesson-title">Title</Label>
                <Input
                  id="lesson-title"
                  value={lessonSettings.title}
                  onChange={(e) => setLessonSettings(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lesson-description">Description</Label>
                <Textarea
                  id="lesson-description"
                  value={lessonSettings.description}
                  onChange={(e) => setLessonSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <Select value={lessonSettings.contentType} onValueChange={(value) => setLessonSettings(prev => ({ ...prev, contentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-published"
                  checked={lessonSettings.isPublished}
                  onChange={(e) => setLessonSettings(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
                <Label htmlFor="is-published">Published</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setLessonSettings({ title: "", description: "", contentType: "text", isPublished: false })}>
                  Cancel
                </Button>
                <Button onClick={updateLessonSettings} disabled={updateLessonMutation.isPending}>
                  {updateLessonMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quiz Builder Dialog */}
        <Dialog open={showQuizBuilder} onOpenChange={setShowQuizBuilder}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="quiz-builder-description">
            <DialogHeader>
              <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
            </DialogHeader>
            <div id="quiz-builder-description" className="sr-only">
              Create or edit a quiz with multiple choice questions and correct answers
            </div>
            
            <div className="space-y-6">
              {/* Quiz Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quiz-title">Quiz Title</Label>
                  <Input
                    id="quiz-title"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quiz title..."
                  />
                </div>
                <div>
                  <Label htmlFor="passing-score">Passing Score (%)</Label>
                  <Input
                    id="passing-score"
                    type="number"
                    min="0"
                    max="100"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 80 }))}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {quizForm.questions.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No questions yet</p>
                    <p className="mb-4">Start building your quiz by adding questions</p>
                    <Button onClick={addQuestion}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizForm.questions.map((question, index) => (
                      <Card key={question.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <Label htmlFor={`question-${question.id}`} className="text-base font-medium">
                              Question {index + 1}
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div>
                            <Input
                              id={`question-${question.id}`}
                              value={question.question}
                              onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                              placeholder="Enter your question..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Answer Options</Label>
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={question.correctAnswer === optIndex}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      updateQuestion(question.id, { correctAnswer: optIndex });
                                    }
                                  }}
                                />
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optIndex] = e.target.value;
                                    updateQuestion(question.id, { options: newOptions });
                                  }}
                                  placeholder={`Option ${optIndex + 1}...`}
                                  className="flex-1"
                                />
                                <span className="text-xs text-neutral-500 min-w-[60px]">
                                  {question.correctAnswer === optIndex ? (
                                    <span className="text-green-600 font-medium flex items-center">
                                      <Check className="w-3 h-3 mr-1" />
                                      Correct
                                    </span>
                                  ) : (
                                    'Option'
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowQuizBuilder(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => editingQuiz ? updateQuiz(editingQuiz.id) : addQuiz()}
                  disabled={!quizForm.title.trim() || quizForm.questions.length === 0}
                >
                  {editingQuiz ? 'Update Quiz' : 'Add Quiz'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
        />
        <input
          ref={videoInputRef}
          type="file"
          className="hidden"
          accept="video/*"
        />
      </div>
    </div>
  );
}

// Add Content Form Component
function AddContentForm({ onAdd, onCancel }: { onAdd: (content: string) => void; onCancel: () => void }) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onAdd(content);
      setContent("");
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your content here... You can use basic HTML formatting."
        rows={8}
        className="font-mono"
      />
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!content.trim()}>
          Add Content
        </Button>
      </div>
    </div>
  );
}

// Edit Content Form Component
function EditContentForm({ 
  content, 
  onSave, 
  onCancel 
}: { 
  content: LessonContent; 
  onSave: (content: string) => void; 
  onCancel: () => void 
}) {
  const [editedContent, setEditedContent] = useState(content.content);

  const handleSubmit = () => {
    onSave(editedContent);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        placeholder="Edit your content... You can use basic HTML formatting."
        rows={8}
        className="font-mono"
      />
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}