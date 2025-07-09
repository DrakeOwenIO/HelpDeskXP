import { useState } from "react";
import Navigation from "@/components/navigation";
import CourseCard from "@/components/course-card";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@shared/schema";

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const { data: allCourses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    retry: false,
  });

  const { data: freeCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses/free"],
    retry: false,
  });

  const { data: premiumCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses/premium"],
    retry: false,
  });

  const categories = ["Hardware Basics", "Security & Safety", "Software Solutions"];
  const levels = ["Beginner", "Intermediate", "Advanced"];

  const filterCourses = (courses: Course[] | undefined) => {
    if (!courses) return [];
    
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
      const matchesLevel = levelFilter === "all" || course.level === levelFilter;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setLevelFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Course Catalog</h1>
          <p className="text-lg text-neutral-600">
            Discover comprehensive tech support training designed for everyday users
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Course Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="free">Free Courses</TabsTrigger>
            <TabsTrigger value="premium">Premium Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-neutral-900">
                All Courses ({filterCourses(allCourses).length})
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterCourses(allCourses).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {filterCourses(allCourses).length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-600">No courses found matching your criteria.</p>
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="free" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-neutral-900">
                Free Courses ({filterCourses(freeCourses).length})
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterCourses(freeCourses).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {filterCourses(freeCourses).length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-600">No free courses found matching your criteria.</p>
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="premium" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-neutral-900">
                Premium Courses ({filterCourses(premiumCourses).length})
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterCourses(premiumCourses).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {filterCourses(premiumCourses).length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-600">No premium courses found matching your criteria.</p>
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
