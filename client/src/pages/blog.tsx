import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export default function Blog() {
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts'],
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            HelpDeskXP Blog
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Expert insights, tips, and guides to help you master tech support and computer troubleshooting
          </p>
        </div>

        {/* Blog Posts */}
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-8">
                  <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2 mb-6"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-full"></div>
                    <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/6"></div>
                  </div>
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
              <p className="text-neutral-600">
                Check back soon for helpful guides and insights from our tech support experts.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id}>
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link href={`/blog/${post.id}`}>
                          <h2 className="text-2xl font-bold text-neutral-900 mb-3 hover:text-primary transition-colors cursor-pointer">
                            {post.title}
                          </h2>
                        </Link>
                        
                        <div className="flex items-center gap-4 text-sm text-neutral-600 mb-4">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{post.authorName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {post.publishedAt 
                                ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                                : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                              }
                            </span>
                          </div>
                        </div>

                        {post.excerpt && (
                          <p className="text-neutral-700 text-lg leading-relaxed mb-6">
                            {post.excerpt}
                          </p>
                        )}

                        <Link href={`/blog/${post.id}`}>
                          <Button variant="outline" className="group">
                            Read More
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>

                      {post.featuredImage && (
                        <div className="ml-6 flex-shrink-0">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}