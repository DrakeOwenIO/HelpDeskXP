import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, BookOpen, User, Settings, Shield, LogOut, Users } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/forum", label: "Forums" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
  ];

  const authenticatedNavLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/courses", label: "Courses" },
    { href: "/forum", label: "Forums" },
    { href: "/blog", label: "Blog" },
    { href: "/profile", label: "Profile" },
  ];

  const currentNavLinks = isAuthenticated ? authenticatedNavLinks : navLinks;

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleSignUp = () => {
    window.location.href = "/register";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link href={isAuthenticated ? "/" : "/"}>
                <h1 className="text-2xl font-bold text-primary cursor-pointer">HelpDeskXP</h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {currentNavLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <button 
                    className={`nav-link px-3 py-2 text-base font-medium transition-colors ${
                      location === link.href ? "text-primary" : ""
                    }`}
                  >
                    {link.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {user?.isPremium && (
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                    Premium
                  </span>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                        <AvatarFallback>
                          {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/courses">
                      <DropdownMenuItem>
                        <BookOpen className="mr-2 h-4 w-4" />
                        My Courses
                      </DropdownMenuItem>
                    </Link>
                    {user?.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/admin">
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </DropdownMenuItem>
                        </Link>
                        {user?.isSuperAdmin && (
                          <Link href="/admin/accounts">
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Account Management
                            </DropdownMenuItem>
                          </Link>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={handleLogin} className="text-base font-medium">
                  Sign In
                </Button>
                <Button onClick={handleSignUp} className="btn-primary px-6 py-2 text-base font-medium">
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-6">
                  {currentNavLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link block px-3 py-2 text-base font-medium w-full text-left ${
                          location === link.href ? "text-primary" : ""
                        }`}
                      >
                        {link.label}
                      </button>
                    </Link>
                  ))}
                  
                  <div className="border-t pt-4">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="px-3 py-2">
                          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-neutral-600">{user?.email}</p>
                          {user?.isPremium && (
                            <span className="bg-primary text-white px-2 py-1 rounded text-xs font-medium mt-2 inline-block">
                              Premium
                            </span>
                          )}
                        </div>
                        {user?.isAdmin && (
                          <Link href="/admin">
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="ghost" 
                          onClick={handleLogout}
                          className="w-full justify-start"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button 
                          variant="ghost" 
                          onClick={handleLogin}
                          className="w-full"
                        >
                          Sign In
                        </Button>
                        <Button 
                          onClick={handleSignUp}
                          className="w-full btn-primary"
                        >
                          Get Started
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
