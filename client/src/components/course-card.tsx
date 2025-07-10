import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, Play, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course } from "@shared/schema";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if user has purchased this course
  const { data: hasPurchased } = useQuery({
    queryKey: [`/api/user/purchases/${course.id}`],
    enabled: !!user && !!course.id,
    retry: false,
  });

  // Check if user is enrolled in this course
  const { data: enrollment } = useQuery({
    queryKey: [`/api/user/enrollments/${course.id}`],
    enabled: !!user && !!course.id,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${course.id}/enroll`);
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

  const canAccess = course.isFree || user?.isPremium || hasPurchased || enrollment;
  const isEnrolled = !!enrollment;
  const hasAccess = canAccess && isEnrolled;

  const handleAction = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    // If user has access and is enrolled, go to course viewer
    if (hasAccess) {
      setLocation(`/courses/${course.id}/viewer`);
      return;
    }

    // If user can access but isn't enrolled, enroll them
    if (canAccess && !isEnrolled) {
      enrollMutation.mutate();
      return;
    }

    // Otherwise navigate to course detail for purchase
    setLocation(`/courses/${course.id}`);
  };

  const getActionText = () => {
    if (!isAuthenticated) return "Sign In to Enroll";
    if (hasAccess) return "Continue Course";
    if (canAccess && !isEnrolled) return course.isFree ? "Start Free Course" : "Start Course";
    return course.price ? `Buy Course - $${course.price}` : "Get Membership";
  };

  const getActionIcon = () => {
    if (hasAccess || canAccess) return <Play className="w-4 h-4 mr-2" />;
    return <Lock className="w-4 h-4 mr-2" />;
  };

  return (
    <Card className="course-card bg-white shadow-sm overflow-hidden">
      <Link href={`/courses/${course.id}`}>
        <img 
          src={course.thumbnailUrl || "https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"}
          alt={course.title}
          className="w-full h-48 object-cover cursor-pointer"
        />
      </Link>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={course.isFree ? "bg-secondary" : "bg-primary"}>
            {course.isFree ? "FREE" : course.price ? `$${course.price}` : "MEMBERSHIP"}
          </Badge>
          <div className="flex items-center text-sm text-neutral-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{course.duration}</span>
          </div>
        </div>
        
        <Link href={`/courses/${course.id}`}>
          <h3 className="text-xl font-semibold text-neutral-900 mb-3 cursor-pointer hover:text-primary transition-colors">
            {course.title}
          </h3>
        </Link>
        
        <p className="text-neutral-600 mb-4 line-clamp-3">
          {course.shortDescription || course.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-neutral-500">
            <Star className="w-4 h-4 mr-2" />
            <span>{course.level}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-500">
            <Users className="w-4 h-4 mr-2" />
            <span>{course.studentCount?.toLocaleString() || 0} students</span>
          </div>
        </div>
        
        {course.price && !course.isFree && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-neutral-900">${course.price}</span>
            <span className="text-sm text-neutral-500">One-time purchase</span>
          </div>
        )}
        
        <Button 
          onClick={handleAction}
          className="w-full py-3 flex items-center justify-center"
          disabled={enrollMutation.isPending}
          variant={canAccess ? "default" : "outline"}
        >
          {enrollMutation.isPending ? (
            "Enrolling..."
          ) : (
            <>
              {getActionIcon()}
              {getActionText()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
