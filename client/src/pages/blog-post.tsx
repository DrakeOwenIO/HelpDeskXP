import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, MessageSquare, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

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

interface BlogComment {
  id: number;
  postId: number;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId?: number;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPost() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  const { data: post, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog/posts', id],
    queryFn: () => fetch(`/api/blog/posts/${id}`).then(res => res.json()),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<BlogComment[]>({
    queryKey: ['/api/blog/posts', id, 'comments'],
    queryFn: () => fetch(`/api/blog/posts/${id}/comments`).then(res => res.json()),
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/blog/posts/${id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts', id, 'comments'] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to comment. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      console.error("Error creating comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to comment.",
        variant: "destructive",
      });
      return;
    }

    commentMutation.mutate(commentContent.trim());
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-neutral-200 rounded w-full"></div>
              ))}
            </div>
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
              <p className="text-neutral-600 mb-4">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/blog">
                <Button>Back to Blog</Button>
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
        <div className="mb-6">
          <Link href="/blog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Blog Post */}
        <article>
          <Card className="mb-8">
            <CardContent className="p-8">
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="mb-8">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Post Header */}
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-neutral-900 mb-4">
                  {post.title}
                </h1>
                
                <div className="flex items-center gap-6 text-neutral-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Published {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </header>

              {/* Post Content */}
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-neutral-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
                />
              </div>
            </CardContent>
          </Card>
        </article>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="mb-4">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!commentContent.trim() || commentMutation.isPending}
                >
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </form>
            ) : (
              <div className="mb-8 p-6 bg-neutral-100 rounded-lg text-center">
                <p className="text-neutral-600 mb-4">
                  Sign in to join the conversation and share your thoughts.
                </p>
                <Button onClick={() => window.location.href = "/api/login"}>
                  Sign In to Comment
                </Button>
              </div>
            )}

            <Separator className="mb-6" />

            {/* Comments List */}
            {commentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
                    <div className="h-16 bg-neutral-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-neutral-200 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-neutral-900">
                        {comment.authorName}
                      </span>
                      <span className="text-sm text-neutral-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-neutral-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}