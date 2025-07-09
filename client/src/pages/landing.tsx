import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MembershipCards from "@/components/membership-cards";
import { Computer, Shield, Settings, Clock, Users, Star } from "lucide-react";

export default function Landing() {
  const categories = [
    {
      icon: Computer,
      title: "Hardware Basics",
      description: "Learn to identify and fix common hardware issues like slow performance, connectivity problems, and basic maintenance.",
      courseCount: "8 Courses • Free & Premium",
      color: "bg-primary"
    },
    {
      icon: Shield,
      title: "Security & Safety", 
      description: "Protect yourself from viruses, scams, and online threats with practical security practices and tools.",
      courseCount: "12 Courses • Free & Premium",
      color: "bg-secondary"
    },
    {
      icon: Settings,
      title: "Software Solutions",
      description: "Troubleshoot software crashes, installation issues, and optimize your programs for better performance.",
      courseCount: "15 Courses • Free & Premium", 
      color: "bg-accent"
    }
  ];

  const featuredCourses = [
    {
      id: 1,
      title: "Computer Running Slow? Quick Fixes",
      description: "Learn the most common reasons your computer slows down and simple steps to speed it up again.",
      duration: "45 min",
      level: "Beginner",
      students: "12,450 students",
      price: null,
      isFree: true,
      image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
    },
    {
      id: 2,
      title: "Understanding Error Messages",
      description: "Decode common error messages and learn step-by-step solutions to fix them yourself.",
      duration: "2.5 hours",
      level: "Beginner", 
      students: "8,230 students",
      price: "$29",
      isFree: false,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
    },
    {
      id: 3,
      title: "Essential Computer Security",
      description: "Protect your computer and personal information with practical security measures and safe browsing habits.",
      duration: "3 hours",
      level: "Beginner",
      students: "15,680 students", 
      price: "$39",
      isFree: false,
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
    }
  ];

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const handleStartFreeCourse = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Learn Tech Support Skills at Your Own Pace
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Master computer troubleshooting with our step-by-step courses designed for everyday users. No technical background required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleStartFreeCourse}
                  className="bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-neutral-100"
                >
                  Start Free Course
                </Button>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-white/20 text-white border-2 border-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-primary transition-colors"
                >
                  View All Courses
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Person learning computer skills" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">What You'll Learn</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Our courses cover the most common computer problems you'll encounter, with simple solutions you can implement right away.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="bg-neutral-50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mx-auto mb-6`}>
                      <Icon className="text-white w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">{category.title}</h3>
                    <p className="text-neutral-600 mb-6">{category.description}</p>
                    <span className="text-sm text-secondary font-medium">{category.courseCount}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Popular Courses</h2>
              <p className="text-lg text-neutral-600">Start with these beginner-friendly courses</p>
            </div>
            <Button 
              variant="link" 
              onClick={handleGetStarted}
              className="text-primary font-semibold text-lg"
            >
              View All Courses
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="course-card bg-white shadow-sm overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={course.isFree ? "bg-secondary" : "bg-primary"}>
                      {course.isFree ? "FREE" : "PREMIUM"}
                    </Badge>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">{course.title}</h3>
                  <p className="text-neutral-600 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <Star className="w-4 h-4 mr-2" />
                      <span>{course.level}</span>
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{course.students}</span>
                    </div>
                  </div>
                  {course.price && (
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-neutral-900">{course.price}</span>
                      <span className="text-sm text-neutral-500">One-time purchase</span>
                    </div>
                  )}
                  <Button 
                    onClick={course.isFree ? handleStartFreeCourse : handleGetStarted}
                    className="w-full btn-primary py-3"
                  >
                    {course.isFree ? "Start Free Course" : "Buy Course"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <MembershipCards />

      {/* Footer */}
      <footer className="bg-neutral-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">HelpDeskXP</h3>
              <p className="text-neutral-300 mb-4">
                Making technology accessible through simple, step-by-step training courses.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Courses</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><a href="#" className="hover:text-white transition-colors">Hardware Basics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security & Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Software Solutions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Free Courses</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Technical Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2024 HelpDeskXP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
