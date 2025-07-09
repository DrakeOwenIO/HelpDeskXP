import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, PenTool, Eye, MessageSquare } from "lucide-react";

const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title cannot exceed 200 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
});

type PostFormData = z.infer<typeof postFormSchema>;

const categories = [
  "General",
  "Hardware",
  "Software", 
  "Security",
  "Networking",
  "Mobile Devices",
  "Troubleshooting"
];

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const [isPreview, setIsPreview] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const response = await apiRequest("POST", "/api/forum/posts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your post has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setLocation("/forums");
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
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostFormData) => {
    createPostMutation.mutate(data);
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Sign In Required</h2>
            <p className="text-neutral-600 mb-4">
              You need to be signed in to create forum posts.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/forums">Back to Forums</Link>
              </Button>
              <Button onClick={() => window.location.href = "/api/login"}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const watchedTitle = form.watch("title");
  const watchedContent = form.watch("content");
  const watchedCategory = form.watch("category");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/forums">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forums
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">Create New Post</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Write Your Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose the best category for your post" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Write a clear, descriptive title for your post..."
                          className="text-lg"
                          {...field} 
                        />
                      </FormControl>
                      <div className="text-sm text-neutral-500">
                        {field.value?.length || 0}/200 characters
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your question, experience, or knowledge... Be specific and provide details that will help others understand your situation or learn from your experience."
                          rows={12}
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <div className="text-sm text-neutral-500">
                        {field.value?.length || 0} characters • Minimum 20 characters
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {isPreview ? "Hide Preview" : "Show Preview"}
                  </Button>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/forums">Cancel</Link>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPostMutation.isPending || !form.formState.isValid}
                    >
                      {createPostMutation.isPending ? "Creating..." : "Create Post"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className={isPreview ? "" : "hidden lg:block"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!watchedTitle && !watchedContent ? (
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>Start writing to see a preview of your post</p>
              </div>
            ) : (
              <div className="space-y-4">
                {watchedCategory && (
                  <div className="inline-block bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-sm">
                    {watchedCategory}
                  </div>
                )}
                
                {watchedTitle && (
                  <h2 className="text-xl font-semibold text-neutral-900 leading-tight">
                    {watchedTitle}
                  </h2>
                )}
                
                {watchedContent && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {watchedContent}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-neutral-500 pt-4 border-t">
                  Posted by You • Just now
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}