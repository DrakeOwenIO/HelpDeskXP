import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MessageSquare, ThumbsUp, Clock, User, ArrowLeft, Reply, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  upvotes: number;
  replyCount: number;
  isSticky: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ForumReply {
  id: number;
  postId: number;
  content: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  parentReplyId?: number;
  createdAt: string;
  updatedAt: string;
}

const replyFormSchema = z.object({
  content: z.string().min(5, "Reply must be at least 5 characters"),
});

const editPostFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title cannot exceed 200 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
});

type ReplyFormData = z.infer<typeof replyFormSchema>;
type EditPostFormData = z.infer<typeof editPostFormSchema>;

const categories = [
  "General",
  "Hardware",
  "Software", 
  "Security",
  "Networking",
  "Mobile Devices",
  "Troubleshooting"
];

export default function ForumPost() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const editForm = useForm<EditPostFormData>({
    resolver: zodResolver(editPostFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  const { data: post, isLoading: postLoading } = useQuery<ForumPost>({
    queryKey: ['/api/forum/posts', id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forum/posts/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  const { data: repliesData, isLoading: repliesLoading } = useQuery<ForumReply[]>({
    queryKey: ['/api/forum/posts', id, 'replies'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forum/posts/${id}/replies`);
      return response.json();
    },
    enabled: !!id,
  });

  const replies = Array.isArray(repliesData) ? repliesData : [];
  


  const voteOnPostMutation = useMutation({
    mutationFn: async ({ postId, voteType }: { postId: number; voteType: string }) => {
      return await apiRequest("POST", "/api/forum/vote", { postId, voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "You need to sign in to vote. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteOnReplyMutation = useMutation({
    mutationFn: async ({ replyId, voteType }: { replyId: number; voteType: string }) => {
      return await apiRequest("POST", "/api/forum/vote", { replyId, voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts', id, 'replies'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "You need to sign in to vote. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (data: ReplyFormData) => {
      return await apiRequest("POST", `/api/forum/posts/${id}/replies`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts', id, 'replies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setShowReplyForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Your reply has been posted!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "You need to sign in to reply. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editPostMutation = useMutation({
    mutationFn: async (data: EditPostFormData) => {
      const response = await apiRequest("PUT", `/api/forum/posts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Your post has been updated!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You can only edit your own posts.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/forum/posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      toast({
        title: "Success",
        description: "Post deleted successfully.",
      });
      setLocation('/forum');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You can only delete your own posts.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVotePost = (voteType: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "You need to sign in to vote. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
    voteOnPostMutation.mutate({ postId: parseInt(id!), voteType });
  };

  const handleVoteReply = (replyId: number, voteType: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "You need to sign in to vote. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
    voteOnReplyMutation.mutate({ replyId, voteType });
  };

  const handleReply = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "You need to sign in to reply. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
    setShowReplyForm(true);
  };

  const onSubmit = (data: ReplyFormData) => {
    createReplyMutation.mutate(data);
  };

  const onEditSubmit = (data: EditPostFormData) => {
    editPostMutation.mutate(data);
  };

  const handleEditPost = () => {
    if (post) {
      editForm.reset({
        title: post.title,
        content: post.content,
        category: post.category,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDeletePost = () => {
    deletePostMutation.mutate();
  };

  // Check if current user is the author of the post
  const isPostAuthor = user && post && user.id === post.authorId;

  if (postLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/2 mb-6"></div>
            <Card>
              <CardContent className="p-6">
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Post not found</h3>
              <p className="text-neutral-600 mb-4">The post you're looking for doesn't exist.</p>
              <Link href="/forum">
                <Button>Back to Forum</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/forum">
          <Button variant="outline" className="mb-6 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Button>
        </Link>

        {/* Post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {post.isSticky && (
                  <Badge variant="secondary">📌 Pinned</Badge>
                )}
                <Badge variant="outline">{post.category}</Badge>
                {post.isLocked && (
                  <Badge variant="destructive">🔒 Locked</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVotePost('upvote')}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {post.upvotes}
                </Button>
                {isPostAuthor && (
                  <div className="flex items-center gap-1">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleEditPost}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Edit Post</DialogTitle>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                              control={editForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
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
                              control={editForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your post title..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Content</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Share your question, experience, or knowledge..."
                                      rows={8}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={editPostMutation.isPending}>
                                {editPostMutation.isPending ? "Updating..." : "Update Post"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone and will also delete all replies to this post.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeletePost}
                            disabled={deletePostMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6">
              <p className="text-neutral-700 whitespace-pre-wrap">{post.content}</p>
            </div>
            <Separator className="mb-4" />
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {post.createdAt && !isNaN(new Date(post.createdAt).getTime()) 
                    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                    : "Recently"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Replies ({post.replyCount})
            </h3>
            {!post.isLocked && (
              <Button onClick={handleReply} className="flex items-center gap-2">
                <Reply className="w-4 h-4" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Reply</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your thoughts..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createReplyMutation.isPending}>
                        {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReplyForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Replies */}
        {repliesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : replies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-neutral-900 mb-2">No replies yet</h4>
              <p className="text-neutral-600 mb-4">Be the first to share your thoughts!</p>
              {post && !post.isLocked && (
                <Button onClick={handleReply}>Write Reply</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <User className="w-4 h-4" />
                      <span>{reply.authorName}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>
                        {reply.createdAt && !isNaN(new Date(reply.createdAt).getTime()) 
                          ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })
                          : "Recently"
                        }
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVoteReply(reply.id, 'upvote')}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {reply.upvotes}
                    </Button>
                  </div>
                  <p className="text-neutral-700 whitespace-pre-wrap">{reply.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}