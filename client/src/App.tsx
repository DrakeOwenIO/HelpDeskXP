import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import CourseViewer from "@/pages/course-viewer";
import Forum from "@/pages/forum";
import ForumPost from "@/pages/forum-post";
import CreatePost from "@/pages/create-post";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCourses from "@/pages/admin/courses";
import CourseBuilder from "@/pages/admin/course-builder";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import AccountManagement from "@/pages/admin/account-management";
import Profile from "@/pages/profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/forum" component={Forum} />
          <Route path="/forum/create" component={CreatePost} />
          <Route path="/forum/posts/:id" component={ForumPost} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:id" component={BlogPost} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:id" component={CourseDetail} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/courses/:courseId/viewer" component={CourseViewer} />
          <Route path="/forum" component={Forum} />
          <Route path="/forum/create" component={CreatePost} />
          <Route path="/forum/posts/:id" component={ForumPost} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:id" component={BlogPost} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/courses" component={AdminCourses} />
          <Route path="/admin/courses/:courseId/builder" component={CourseBuilder} />
          <Route path="/admin/course-builder/:courseId" component={CourseBuilder} />
          <Route path="/admin/accounts" component={AccountManagement} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;