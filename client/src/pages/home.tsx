import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, TrendingUp, Star, CheckCircle, Play, Users, Calendar } from "lucide-react";
import type { Course, Enrollment } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

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
    enabled: !!user,
  });

  // Find the main masterclass course (assuming it's the first or has specific title)
  const masterclassCourse = courses?.find(course => 
    course.title.toLowerCase().includes('masterclass') || 
    course.title.toLowerCase().includes('computer usage') ||
    course.title.toLowerCase().includes('everyday')
  ) || courses?.[0];

  const isEnrolled = enrollments?.some(e => e.courseId === masterclassCourse?.id);
  const courseProgress = enrollments?.find(e => e.courseId === masterclassCourse?.id)?.progress || 0;

  if (isLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6">
            <Skeleton className="h-96 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
            Master everyday computer skills and troubleshooting with our comprehensive course.
          </p>
        </div>

        {/* Main Course Hero Section */}
        {masterclassCourse && (
          <section className="mb-8">
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative">
                  <img 
                    src={masterclassCourse.thumbnailUrl || "https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                    alt={masterclassCourse.title}
                    className="w-full h-full object-cover min-h-[400px]"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <p className="text-white text-sm">Watch Preview</p>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="bg-primary text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured Course
                    </Badge>
                    <Badge variant="outline">Beginner Friendly</Badge>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                    {masterclassCourse.title}
                  </h2>
                  
                  <p className="text-neutral-600 mb-6">
                    {masterclassCourse.description || "Learn essential computer skills including task manager usage, printer setup, router configuration, and everyday troubleshooting techniques. Perfect for building confidence with technology."}
                  </p>

                  <div className="flex items-center text-sm text-neutral-600 mb-6">
                    <Clock className="w-4 h-4 mr-2" />
                    {masterclassCourse.duration || "8+ hours of content"}
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Your Progress</span>
                        <span className="text-sm font-semibold">{courseProgress}%</span>
                      </div>
                      <Progress value={courseProgress} className="h-2" />
                      <Link href={`/courses/${masterclassCourse.id}`}>
                        <Button size="lg" className="w-full">
                          {courseProgress === 0 ? 'Start Course' : 'Continue Learning'}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-neutral-900">
                          ${masterclassCourse.price || 49}
                        </span>
                        <span className="text-sm text-neutral-500">One-time payment</span>
                      </div>
                      <Link href={`/courses/${masterclassCourse.id}`}>
                        <Button size="lg" className="w-full">
                          Enroll Now
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </section>
        )}

        {/* Quick Stats */}
        {isEnrolled && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
                    <BookOpen className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Course Progress</p>
                    <p className="text-2xl font-bold text-neutral-900">{courseProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mr-4">
                    <Clock className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Time Invested</p>
                    <p className="text-2xl font-bold text-neutral-900">{Math.floor(courseProgress * 0.08)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mr-4">
                    <Award className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Completion</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {courseProgress === 100 ? 'Done!' : 'In Progress'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Highlights */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">What You'll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-neutral-900">Task Manager Mastery</p>
                    <p className="text-sm text-neutral-600">Learn to monitor and manage system processes effectively</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-neutral-900">Printer Setup & Troubleshooting</p>
                    <p className="text-sm text-neutral-600">Connect and configure printers with confidence</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-neutral-900">Router Configuration</p>
                    <p className="text-sm text-neutral-600">Access and manage your home network settings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-neutral-900">Essential Troubleshooting</p>
                    <p className="text-sm text-neutral-600">Solve common computer problems step-by-step</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Coming Soon Banner */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 mr-3" />
              <h2 className="text-3xl font-bold">More Courses Coming Soon!</h2>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              We're working on new lessons that build on what you've learned — including simple guides on topics like home networking, computer hardware, and deeper troubleshooting. Stay tuned for helpful new content designed with beginners in mind!
            </p>
            <div className="flex justify-center flex-wrap gap-4 mb-8">
              <Badge variant="secondary" className="bg-white bg-opacity-20 text-white text-sm px-4 py-2">
                Advanced Network Security
              </Badge>
              <Badge variant="secondary" className="bg-white bg-opacity-20 text-white text-sm px-4 py-2">
                Hardware Diagnostics
              </Badge>
              <Badge variant="secondary" className="bg-white bg-opacity-20 text-white text-sm px-4 py-2">
                Enterprise Support
              </Badge>
            </div>
            <Button 
              className="bg-white text-blue-600 hover:bg-neutral-100 px-8 py-3 text-lg font-semibold"
            >
              Get Notified
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
