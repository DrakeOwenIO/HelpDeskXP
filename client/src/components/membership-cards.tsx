import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export default function MembershipCards() {
  const { isAuthenticated } = useAuth();

  const handleSignupFree = () => {
    if (isAuthenticated) {
      window.location.href = "/courses";
    } else {
      window.location.href = "/login";
    }
  };

  const handleUpgradePremium = () => {
    if (isAuthenticated) {
      // In a real implementation, this would handle subscription upgrade
      window.location.href = "/courses";
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Choose Your Learning Path</h2>
          <p className="text-lg text-neutral-600">
            Get a membership for unlimited access to all courses, or buy individual courses as needed
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Membership */}
          <Card className="bg-neutral-50 border-2 border-neutral-200 relative">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Free Account</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">$0</div>
                <p className="text-neutral-600">Forever free</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 flex-shrink-0" />
                  <span>Access to all free courses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 flex-shrink-0" />
                  <span>Basic troubleshooting guides</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 flex-shrink-0" />
                  <span>Community forum access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 flex-shrink-0" />
                  <span>Progress tracking</span>
                </li>
              </ul>
              
              <Button 
                onClick={handleSignupFree}
                className="w-full bg-neutral-700 text-white py-3 font-semibold hover:bg-neutral-800 transition-colors"
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>
          
          {/* Premium Membership */}
          <Card className="hero-gradient border-2 border-primary text-white relative overflow-hidden">
            <Badge className="absolute top-4 right-4 bg-white text-primary font-bold">
              POPULAR
            </Badge>
            
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Premium Membership</h3>
                <div className="text-4xl font-bold mb-2">$19</div>
                <p className="text-blue-100">per month</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span>Unlimited access to all courses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span>New courses added monthly</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span>Downloadable resources</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  <span>Certificate of completion</span>
                </li>
              </ul>
              
              <Button 
                onClick={handleUpgradePremium}
                className="w-full bg-white text-primary py-3 font-semibold hover:bg-neutral-100 transition-colors"
              >
                Start Premium Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
