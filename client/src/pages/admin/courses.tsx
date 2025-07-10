import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Settings, Upload, Image, Video } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertCourseSchema, type Course, type InsertCourse } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";

const courseFormSchema = insertCourseSchema.extend({
  learningObjectives: z.string().transform((val) => val.split('\n').filter(Boolean)),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

export default function AdminCourses() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
    retry: false,
    enabled: !!user && user?.isAdmin,
  });

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      shortDescription: "",
      category: "",
      level: "Beginner",
      duration: "",
      price: "0",
      isFree: false,
      isPremium: false,
      videoUrl: "",
      thumbnailUrl: "",
      content: "",
      learningObjectives: "",
      isPublished: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      const response = await apiRequest("POST", "/api/admin/courses", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setIsCreateDialogOpen(false);
      form.reset();
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
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCourse> }) => {
      const response = await apiRequest("PUT", `/api/admin/courses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setEditingCourse(null);
      form.reset();
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
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
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
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CourseFormData) => {
    const courseData: InsertCourse = {
      ...data,
      price: data.price || "0", // Keep as string for schema validation
      learningObjectives: typeof data.learningObjectives === 'string' 
        ? data.learningObjectives.split('\n').filter(Boolean)
        : data.learningObjectives,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: courseData });
    } else {
      createMutation.mutate(courseData);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription || "",
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price?.toString() || "0",
      isFree: course.isFree || false,
      isPremium: course.isPremium || false,
      videoUrl: course.videoUrl || "",
      thumbnailUrl: course.thumbnailUrl || "",
      content: course.content || "",
      learningObjectives: course.learningObjectives?.join('\n') || "",
      isPublished: course.isPublished || false,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setEditingCourse(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await fetch('/api/admin/course-thumbnail', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      form.setValue('thumbnailUrl', result.thumbnailUrl);
      
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully!",
      });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload thumbnail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setThumbnailUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Video file must be less than 500MB",
        variant: "destructive",
      });
      return;
    }

    setVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/admin/course-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      form.setValue('videoUrl', result.videoUrl);
      
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVideoUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Course Management</h1>
            <p className="text-lg text-neutral-600">Create and manage your courses</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? "Edit Course" : "Create New Course"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter course title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 45 minutes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description for course cards" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed course description" 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Hardware Basics">Hardware Basics</SelectItem>
                              <SelectItem value="Security & Safety">Security & Safety</SelectItem>
                              <SelectItem value="Software Solutions">Software Solutions</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Media Files</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Thumbnail Upload */}
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="thumbnailUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course Thumbnail</FormLabel>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                    <Input 
                                      placeholder="Thumbnail URL or upload below" 
                                      {...field} 
                                      readOnly={thumbnailUploading}
                                    />
                                  </FormControl>
                                </div>
                                
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailUpload}
                                    disabled={thumbnailUploading}
                                    className="hidden"
                                    id="thumbnail-upload"
                                  />
                                  <label htmlFor="thumbnail-upload">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={thumbnailUploading}
                                      className="w-full cursor-pointer"
                                      asChild
                                    >
                                      <span>
                                        {thumbnailUploading ? (
                                          <>
                                            <Upload className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <Image className="w-4 h-4 mr-2" />
                                            Upload Thumbnail
                                          </>
                                        )}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                                
                                {field.value && (
                                  <div className="mt-2">
                                    <img
                                      src={field.value}
                                      alt="Thumbnail preview"
                                      className="w-full h-32 object-cover rounded-md border"
                                    />
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Video Upload */}
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course Video</FormLabel>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                    <Input 
                                      placeholder="Video URL or upload below" 
                                      {...field} 
                                      readOnly={videoUploading}
                                    />
                                  </FormControl>
                                </div>
                                
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    disabled={videoUploading}
                                    className="hidden"
                                    id="video-upload"
                                  />
                                  <label htmlFor="video-upload">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={videoUploading}
                                      className="w-full cursor-pointer"
                                      asChild
                                    >
                                      <span>
                                        {videoUploading ? (
                                          <>
                                            <Upload className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <Video className="w-4 h-4 mr-2" />
                                            Upload Video
                                          </>
                                        )}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                                
                                {field.value && field.value.includes('/uploads/course-videos/') && (
                                  <div className="mt-2">
                                    <video
                                      src={field.value}
                                      controls
                                      className="w-full h-32 rounded-md border"
                                    />
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="learningObjectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Objectives (one per line)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What students will learn..."
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed course content..."
                            rows={6}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Free Course</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPremium"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Premium Course</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Published</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                step="0.01"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending 
                        ? "Saving..." 
                        : editingCourse 
                          ? "Update Course" 
                          : "Create Course"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Course List */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses ({courses?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {courses && courses.length > 0 ? (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-neutral-300 rounded-lg mr-4">
                        {course.thumbnailUrl && (
                          <img 
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900">{course.title}</h3>
                        <p className="text-sm text-neutral-500">
                          {course.category} • {course.duration} • {course.studentCount} students
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {course.isFree && <Badge className="bg-secondary text-xs">Free</Badge>}
                          {course.isPremium && <Badge className="bg-primary text-xs">Premium</Badge>}
                          {course.price && !course.isFree && (
                            <Badge variant="outline" className="text-xs">${course.price}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`text-xs ${
                          course.isPublished 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Link href={`/admin/course-builder/${course.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Course Builder
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(course)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-blue-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-600 mb-4">No courses found. Create your first course to get started.</p>
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
