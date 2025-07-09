import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import CourseCard from "@/components/course-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react";
import type { Course, Enrollment } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    retry: false,
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/user/enrollments"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: freeCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses/free"],
    retry: false,
  });

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const enrolledCourses = courses?.filter(course => 
    enrollments?.some(enrollment => enrollment.courseId === course.id)
  ) || [];

  const completedCourses = enrollments?.filter(e => e.completed).length || 0;
  const totalProgress = enrollments?.reduce((sum, e) => sum + e.progress, 0) || 0;
  const avgProgress = enrollments?.length ? Math.round(totalProgress / enrollments.length) : 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome back, {user?.firstName || 'Student'}!
          </h1>
          <p className="text-lg text-neutral-600">
            Continue your learning journey and master new tech support skills.
          </p>
        </div>

        {/* Progress Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
                  <BookOpen className="text-white w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Enrolled Courses</p>
                  <p className="text-2xl font-bold text-neutral-900">{enrolledCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mr-4">
                  <Award className="text-white w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Completed</p>
                  <p className="text-2xl font-bold text-neutral-900">{completedCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="text-white w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-neutral-900">{avgProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="text-white w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Study Hours</p>
                  <p className="text-2xl font-bold text-neutral-900">12.5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        {enrolledCourses.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Continue Learning</h2>
              <Button variant="link" className="text-primary">View All</Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.slice(0, 3).map((course) => {
                const enrollment = enrollments?.find(e => e.courseId === course.id);
                return (
                  <Card key={course.id} className="overflow-hidden">
                    <img 
                      src={course.thumbnailUrl || "https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=200"}
                      alt={course.title}
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-neutral-900 mb-2">{course.title}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{enrollment?.progress || 0}%</span>
                        </div>
                        <Progress value={enrollment?.progress || 0} className="h-2" />
                      </div>
                      <Button className="w-full mt-4" size="sm">
                        Continue Course
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Recommended Courses */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">
              {user?.isPremium ? "New Courses for You" : "Free Courses to Get Started"}
            </h2>
            <Button variant="link" className="text-primary">View All</Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(user?.isPremium ? courses?.slice(0, 6) : freeCourses?.slice(0, 6))?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>

        {/* Upgrade Banner */}
        {!user?.isPremium && (
          <Card className="bg-gradient-to-r from-primary to-blue-700 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Unlock All Courses</h3>
              <p className="text-blue-100 mb-6">
                Get unlimited access to all premium courses, new content monthly, and priority support.
              </p>
              <Button className="bg-white text-primary hover:bg-neutral-100">
                Upgrade to Premium - $19/month
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
