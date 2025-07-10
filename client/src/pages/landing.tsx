import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Computer, Shield, Settings, Clock, Users, Star, CheckCircle, Play, Calendar, BookOpen, Award } from "lucide-react";

export default function Landing() {
  const courseHighlights = [
    {
      icon: Computer,
      title: "Speed Up a Slow Computer",
      description: "Learn how to fix common issues that make your computer sluggish—no tech skills required. You'll be able to make things run faster and smoother with a few simple steps.",
    },
    {
      icon: Settings,
      title: "Set Up Devices Without the Headache",
      description: "Get printers, monitors, and other accessories working without frustration. You'll learn the basic steps to connect and troubleshoot devices confidently.",
    },
    {
      icon: Shield,
      title: "Stay Connected and Protected",
      description: "Understand the basics of staying online and keeping your computer safe. Whether it's fixing a Wi-Fi issue or avoiding sketchy software, you'll know what to do.",
    }
  ];

  const handleGetStarted = () => {
    window.location.href = "/register";
  };

  const handleEnrollNow = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-white/20 text-white mb-6">
                <Star className="w-3 h-3 mr-1" />
                Featured Masterclass
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Everyday Tech Fixes: Basic Computer Skills for Real Life
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Struggling with slow computers, setup issues, or random tech headaches? This beginner-friendly course teaches you how to solve the most common computer problems without needing to call for help. From speeding up your system to connecting printers and fixing internet issues, you'll gain the confidence to handle everyday tech challenges on your own—no experience required.
              </p>
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center text-white">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>8+ hours of content</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-neutral-100"
                >
                  View Course Details
                </Button>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-white/20 text-white border-2 border-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-primary transition-colors"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <img 
                src="https://images.unsplash.com/photo-1588508065123-287b28e013da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Computer troubleshooting and support" 
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-white text-sm">Watch Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">What You'll Master</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Learn the essential computer skills that will make you confident with technology and able to solve common problems on your own.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {courseHighlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <Card key={index} className="bg-neutral-50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="text-white w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">{highlight.title}</h3>
                    <p className="text-neutral-600">{highlight.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Course Content */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Complete Course Breakdown</h2>
            <p className="text-lg text-neutral-600">
              Everything you need to become confident with computers and troubleshooting
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Task Manager Deep Dive</h3>
                  <p className="text-neutral-600">Learn to identify resource-heavy processes, end unresponsive tasks, and optimize system performance.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Complete Printer Mastery</h3>
                  <p className="text-neutral-600">Set up wireless and wired printers, troubleshoot common printing issues, and maintain print quality.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Router Configuration</h3>
                  <p className="text-neutral-600">Access router settings, configure WiFi security, manage connected devices, and optimize network performance.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Essential Troubleshooting</h3>
                  <p className="text-neutral-600">Step-by-step problem-solving techniques for common computer issues like freezing, slow performance, and error messages.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">File Management & Organization</h3>
                  <p className="text-neutral-600">Organize files efficiently, understand file types, and manage storage space effectively.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Basic Security & Updates</h3>
                  <p className="text-neutral-600">Keep your system secure with proper update management and essential security practices.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Learning Today!</h2>
          <h3 className="text-xl md:text-2xl font-semibold mb-6 text-green-100">Master Everyday Tech with Ease</h3>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Enroll in our step-by-step beginner course to learn general troubleshooting, fixing Wi-Fi issues, and more!
          </p>
          <Button 
            onClick={handleEnrollNow}
            className="bg-white text-green-600 hover:bg-neutral-100 px-10 py-4 text-xl font-semibold shadow-lg"
          >
            Enroll Now - $49
          </Button>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
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
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-neutral-100 px-8 py-3 text-lg font-semibold"
          >
            Get Notified
          </Button>
        </div>
      </section>

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
              <h4 className="text-lg font-semibold mb-4">Course</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><a href="#" className="hover:text-white transition-colors">Computer Masterclass</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Task Manager Skills</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Printer Setup</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Router Configuration</a></li>
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
