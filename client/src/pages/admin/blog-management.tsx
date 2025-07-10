import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Calendar, Eye, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  authorId: string;
  authorName: string;
  status: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  slug: z.string().min(1, "Slug is required").max(255, "Slug too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function BlogManagement() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!user?.isSuperAdmin && !user?.canCreateBlogPosts))) {
      toast({
        title: "Unauthorized",
        description: "Blog management access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: posts = [], isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/admin/blog/posts'],
    enabled: isAuthenticated && (user?.isSuperAdmin || user?.canCreateBlogPosts),
  });

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      status: "draft",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const postData = {
        ...data,
        publishedAt: data.status === "published" ? new Date().toISOString() : null,
      };
      return await apiRequest("POST", "/api/admin/blog/posts", postData);
    },
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      toast({
        title: "Success",
        description: "Blog post created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to create blog post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BlogPostFormData }) => {
      const postData = {
        ...data,
        publishedAt: data.status === "published" ? new Date().toISOString() : null,
      };
      return await apiRequest("PUT", `/api/admin/blog/posts/${id}`, postData);
    },
    onSuccess: () => {
      setEditingPost(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      toast({
        title: "Success",
        description: "Blog post updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to update blog post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/blog/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      toast({
        title: "Success",
        description: "Blog post deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BlogPostFormData) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    form.reset({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      featuredImage: post.featuredImage || "",
      status: post.status as "draft" | "published" | "archived",
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    form.setValue("title", title);
    if (!editingPost) {
      form.setValue("slug", generateSlug(title));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
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

        <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Blog Management</h1>
          <p className="text-lg text-neutral-600 mt-2">
            Create and manage blog posts for your audience
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="Enter blog post title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="blog-post-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Short description for previews"
                          className="min-h-[80px]"
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
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write your blog post content here"
                          className="min-h-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/image.jpg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingPost(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingPost
                      ? "Update Post"
                      : "Create Post"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Blog Posts List */}
      {postsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              📝
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No blog posts yet</h3>
            <p className="text-neutral-600 mb-4">
              Create your first blog post to start sharing content with your audience.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-neutral-900">
                        {post.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          post.status === "published"
                            ? "bg-green-100 text-green-800"
                            : post.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {post.publishedAt
                            ? `Published ${formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}`
                            : `Created ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`}
                        </span>
                      </div>
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-neutral-700 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleEdit(post);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this blog post?")) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}