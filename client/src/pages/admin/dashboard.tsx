import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, DollarSign, Star, Plus, Settings, BarChart3, FileText } from "lucide-react";
import { Link } from "wouter";
import type { Course } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

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
    enabled: isAuthenticated && user?.isAdmin,
  });

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter(c => c.isPublished).length || 0;
  const draftCourses = totalCourses - publishedCourses;
  const totalStudents = courses?.reduce((sum, course) => sum + (course.studentCount || 0), 0) || 0;

  const stats = [
    {
      title: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      color: "bg-primary",
      description: `${publishedCourses} published, ${draftCourses} drafts`
    },
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: "bg-secondary",
      description: "Across all courses"
    },
    {
      title: "Revenue",
      value: "$12,450",
      icon: DollarSign,
      color: "bg-accent",
      description: "This month"
    },
    {
      title: "Avg Rating",
      value: "4.8",
      icon: Star,
      color: "bg-purple-500",
      description: "Based on reviews"
    }
  ];

  const quickActions = [
    {
      title: "Create New Course",
      description: "Add a new course to the platform",
      icon: Plus,
      href: "/admin/courses",
      color: "bg-primary"
    },
    {
      title: "Manage Courses",
      description: "Edit existing courses and content",
      icon: BookOpen,
      href: "/admin/courses",
      color: "bg-secondary"
    },
    {
      title: "Blog Management",
      description: "Create and manage blog posts",
      icon: FileText,
      href: "/admin/blog",
      color: "bg-purple-500"
    },
    {
      title: "View Analytics",
      description: "Check performance metrics",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-neutral-600">
              Manage courses, students, and platform settings
            </p>
          </div>
          <Link href="/admin/courses">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                      <p className="text-xs text-neutral-500">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="text-white w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-neutral-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Courses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Recent Courses</h2>
              <Link href="/admin/courses">
                <Button variant="link">View All</Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {courses?.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-neutral-300 rounded-lg mr-4"></div>
                    <div>
                      <h3 className="font-medium text-neutral-900">{course.title}</h3>
                      <p className="text-sm text-neutral-500">
                        {course.category} • {course.duration} • {course.studentCount} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      course.isPublished 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                    <Link href={`/admin/courses`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p className="text-neutral-600">No courses found. Create your first course to get started.</p>
                  <Link href="/admin/courses">
                    <Button className="mt-4">Create Course</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
