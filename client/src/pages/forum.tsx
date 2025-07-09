import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, Clock, User, Plus, Filter, Home } from "lucide-react";
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



const categories = [
  "General",
  "Hardware",
  "Software",
  "Security",
  "Networking",
  "Mobile Devices",
  "Troubleshooting"
];

export default function Forum() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: posts = [], isLoading } = useQuery<ForumPost[]>({
    queryKey: ['/api/forum/posts', selectedCategory],
    queryFn: () => {
      const url = selectedCategory && selectedCategory !== "all"
        ? `/api/forum/posts?category=${encodeURIComponent(selectedCategory)}`
        : '/api/forum/posts';
      return fetch(url).then(res => res.json());
    },
  });



  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Community Forum</h1>
              <p className="text-lg text-neutral-600">
                Share knowledge, ask questions, and connect with other tech support learners
              </p>
            </div>
          </div>
          <Button asChild className="flex items-center gap-2">
            <Link href="/forum/create">
              <Plus className="w-4 h-4" />
              New Post
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Filter by category:</span>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/2 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No posts yet</h3>
              <p className="text-neutral-600 mb-4">
                {selectedCategory 
                  ? `No posts found in the ${selectedCategory} category.`
                  : "Be the first to start a conversation!"
                }
              </p>
              <Button asChild>
                <Link href="/forum/create">Create First Post</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {post.isSticky && (
                        <Badge variant="secondary" className="text-xs">
                          📌 Pinned
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                      {post.isLocked && (
                        <Badge variant="destructive" className="text-xs">
                          🔒 Locked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {post.upvotes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.replyCount}
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/forum/posts/${post.id}`}>
                    <h3 className="text-lg font-semibold text-neutral-900 hover:text-primary cursor-pointer mb-2">
                      {post.title}
                    </h3>
                  </Link>
                  
                  <p className="text-neutral-600 mb-4 line-clamp-2">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 && "..."}
                  </p>
                  
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}