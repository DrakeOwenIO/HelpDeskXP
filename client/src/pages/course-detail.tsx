import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Users, Star, Play, CheckCircle, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course, Enrollment } from "@shared/schema";

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["/api/courses", id],
    retry: false,
  });

  const { data: enrollment } = useQuery<Enrollment>({
    queryKey: ["/api/user/enrollments", id],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: hasPurchased } = useQuery<boolean>({
    queryKey: ["/api/user/purchases", id],
    retry: false,
    enabled: isAuthenticated,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have been enrolled in the course!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
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
        description: "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/purchase`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course purchased successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
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
        description: "Failed to purchase course. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">Course Not Found</h1>
              <p className="text-neutral-600">The requested course could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canAccess = course.isFree || user?.isPremium || hasPurchased || enrollment;
  const isEnrolled = !!enrollment;

  const handleEnroll = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    enrollMutation.mutate();
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    purchaseMutation.mutate();
  };

  const handleStartCourse = () => {
    if (!canAccess) {
      toast({
        title: "Access Required",
        description: "You need to purchase this course or upgrade to premium to access it.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isEnrolled) {
      handleEnroll();
      return;
    }
    
    // Navigate to course player (would be implemented)
    toast({
      title: "Starting Course",
      description: "Course player would open here.",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Course Video/Image Section */}
          <div className="bg-neutral-900 rounded-xl overflow-hidden relative">
            <img 
              src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <Button
                onClick={handleStartCourse}
                className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                disabled={enrollMutation.isPending || purchaseMutation.isPending}
              >
                {canAccess ? (
                  <Play className="text-primary w-8 h-8 ml-1" />
                ) : (
                  <Lock className="text-primary w-8 h-8" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Course Details Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={course.isFree ? "bg-secondary" : "bg-primary"}>
                {course.isFree ? "FREE" : "PREMIUM"}
              </Badge>
              {isEnrolled && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enrolled
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">{course.title}</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-sm text-neutral-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <Star className="w-4 h-4 mr-2" />
                <span>{course.level} Level</span>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <Users className="w-4 h-4 mr-2" />
                <span>{course.studentCount?.toLocaleString()} students</span>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <span className="w-4 h-4 mr-2 text-center">#</span>
                <span>{course.category}</span>
              </div>
            </div>
            
            <p className="text-neutral-700 mb-6">{course.description}</p>
            
            {enrollment && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Your Progress</span>
                  <span>{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-3" />
              </div>
            )}
            
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-neutral-900 mb-3">What you'll learn:</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  {course.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {course.price && !course.isFree && (
              <div className="flex items-center justify-between mb-6 p-4 bg-neutral-100 rounded-lg">
                <span className="text-3xl font-bold text-neutral-900">${course.price}</span>
                <span className="text-sm text-neutral-600">One-time purchase</span>
              </div>
            )}
            
            <div className="space-y-3">
              {!isEnrolled ? (
                course.isFree ? (
                  <Button 
                    onClick={handleEnroll}
                    className="w-full py-3 text-lg"
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll for Free"}
                  </Button>
                ) : canAccess ? (
                  <Button 
                    onClick={handleEnroll}
                    className="w-full py-3 text-lg"
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Start Course"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePurchase}
                    className="w-full py-3 text-lg"
                    disabled={purchaseMutation.isPending}
                  >
                    {purchaseMutation.isPending ? "Processing..." : `Purchase Course - $${course.price}`}
                  </Button>
                )
              ) : (
                <Button 
                  onClick={handleStartCourse}
                  className="w-full py-3 text-lg"
                >
                  Continue Course
                </Button>
              )}
              
              {!course.isFree && !user?.isPremium && !hasPurchased && (
                <div className="text-center text-sm text-neutral-600">
                  <p>Or upgrade to Premium for unlimited access to all courses</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Course Content Preview */}
        {course.content && (
          <Card className="mt-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Course Content</h2>
              <div className="prose max-w-none text-neutral-700">
                <p>{course.content}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
