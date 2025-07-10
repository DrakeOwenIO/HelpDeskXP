import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, Play, X, CheckCircle, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course } from "@shared/schema";

interface CourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!course) return;
      await apiRequest("POST", `/api/courses/${course.id}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have been enrolled in the course!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
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
      if (!course) return;
      await apiRequest("POST", `/api/courses/${course.id}/purchase`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course purchased successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
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

  if (!course) return null;

  const canAccess = course.isFree || user?.isPremium;
  const requiresPurchase = !course.isFree && !user?.isPremium;

  const handleStartCourse = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (course.isFree || user?.isPremium) {
      enrollMutation.mutate();
    } else {
      purchaseMutation.mutate();
    }
  };

  const handleAddToWatchlist = () => {
    toast({
      title: "Added to Watchlist",
      description: "Course has been added to your watchlist.",
    });
  };

  const handlePlayVideo = () => {
    if (canAccess) {
      toast({
        title: "Playing Video",
        description: "Video player would open here.",
      });
    } else {
      toast({
        title: "Access Required",
        description: "Please purchase this course to access the video content.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Course Video/Image Section */}
          <div className="bg-neutral-900 relative">
            <img 
              src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <Button
                onClick={handlePlayVideo}
                className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
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
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 pr-4">{course.title}</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <Badge className={course.isFree ? "bg-secondary" : "bg-primary"}>
                {course.isFree ? "FREE" : "PREMIUM"}
              </Badge>
            </div>
            
            <div className="space-y-4 mb-6">
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
                <span>{course.studentCount?.toLocaleString() || 0} students enrolled</span>
              </div>
            </div>
            
            <p className="text-neutral-700 mb-6">
              {course.shortDescription || course.description}
            </p>
            
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-neutral-900">What you'll learn:</h4>
                <ul className="space-y-2 text-sm text-neutral-600">
                  {course.learningObjectives.slice(0, 3).map((objective, index) => (
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
                <span className="text-2xl font-bold text-neutral-900">${course.price}</span>
                <span className="text-sm text-neutral-600">One-time purchase</span>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={handleStartCourse}
                className="w-full py-3 font-semibold"
                disabled={enrollMutation.isPending || purchaseMutation.isPending}
              >
                {enrollMutation.isPending || purchaseMutation.isPending ? (
                  "Processing..."
                ) : course.isFree ? (
                  "Start Free Course"
                ) : canAccess ? (
                  "Start Course"
                ) : (
                  `Purchase Course - $${course.price}`
                )}
              </Button>
              
              <Button 
                onClick={handleAddToWatchlist}
                variant="outline"
                className="w-full py-3 font-semibold"
              >
                Add to Watchlist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
