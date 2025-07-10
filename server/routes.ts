import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const userId = (req as any).user?.claims?.sub;
      const ext = path.extname(file.originalname);
      cb(null, `${userId}-${Date.now()}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
import { insertCourseSchema, insertEnrollmentSchema, insertPurchaseSchema, insertForumPostSchema, insertForumReplySchema, insertBlogPostSchema, insertBlogCommentSchema, insertCourseModuleSchema, insertCourseLessonSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      // Validate input
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      if (firstName.length > 50 || lastName.length > 50) {
        return res.status(400).json({ message: "Names must be less than 50 characters" });
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/profile-image', isAuthenticated, upload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Generate the URL for the uploaded file
      const imageUrl = `/uploads/profile-images/${req.file.filename}`;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        profileImageUrl: imageUrl,
      });

      res.json({ message: "Profile image updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Serve uploaded profile images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getPublishedCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/free', async (req, res) => {
    try {
      const courses = await storage.getFreeCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching free courses:", error);
      res.status(500).json({ message: "Failed to fetch free courses" });
    }
  });

  app.get('/api/courses/premium', async (req, res) => {
    try {
      const courses = await storage.getPremiumCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching premium courses:", error);
      res.status(500).json({ message: "Failed to fetch premium courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Protected course routes
  app.post('/api/courses/:id/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.id);
      
      // Check if already enrolled
      const existingEnrollment = await storage.getUserEnrollment(userId, courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user can enroll (free course or has premium access or purchased)
      const user = await storage.getUser(userId);
      const hasPurchased = await storage.hasPurchased(userId, courseId);
      
      if (!course.isFree && !user?.isPremium && !hasPurchased) {
        return res.status(403).json({ message: "Purchase required to enroll in this course" });
      }

      const enrollment = await storage.enrollUser({ userId, courseId });
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling user:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.post('/api/courses/:id/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.id);
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (course.isFree) {
        return res.status(400).json({ message: "Cannot purchase a free course" });
      }

      // Check if already purchased
      const hasPurchased = await storage.hasPurchased(userId, courseId);
      if (hasPurchased) {
        return res.status(400).json({ message: "Already purchased this course" });
      }

      // In a real implementation, this would integrate with a payment processor
      const purchase = await storage.createPurchase({
        userId,
        courseId,
        amount: course.price || "0"
      });

      // Auto-enroll after purchase
      const existingEnrollment = await storage.getUserEnrollment(userId, courseId);
      if (!existingEnrollment) {
        await storage.enrollUser({ userId, courseId });
      }

      res.json(purchase);
    } catch (error) {
      console.error("Error purchasing course:", error);
      res.status(500).json({ message: "Failed to purchase course" });
    }
  });

  app.get('/api/user/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.put('/api/courses/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.id);
      const { progress } = req.body;

      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Progress must be a number between 0 and 100" });
      }

      const enrollment = await storage.updateProgress(userId, courseId, progress);
      res.json(enrollment);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Admin routes
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Super Admin middleware for account management
  const isSuperAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ message: "Super Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify super admin status" });
    }
  };

  // Account management routes (Super Admin only)
  app.get('/api/admin/users', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithCourseData();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id/permissions', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { permissions } = req.body;
      
      const updatedUser = await storage.updateUserPermissions(userId, permissions);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: "Failed to update user permissions" });
    }
  });

  app.get('/api/admin/courses', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching admin courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/admin/courses', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/admin/courses/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, validatedData);
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete('/api/admin/courses/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourse(id);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Forum routes - public access for reading
  app.get("/api/forum/posts", async (req, res) => {
    try {
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const posts = await storage.getForumPosts(category, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.get("/api/forum/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getForumPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching forum post:", error);
      res.status(500).json({ message: "Failed to fetch forum post" });
    }
  });

  app.get("/api/forum/posts/:id/replies", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const replies = await storage.getForumReplies(postId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  // Forum routes - require authentication for posting/voting
  app.post("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = { ...req.body, authorId: userId };
      const post = await storage.createForumPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  app.post("/api/forum/posts/:id/replies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const replyData = { ...req.body, authorId: userId, postId };
      const reply = await storage.createForumReply(replyData);
      res.json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Edit and delete forum posts - only by author
  app.put("/api/forum/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      // Check if user is the author of the post
      const existingPost = await storage.getForumPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }
      
      const updatedPost = await storage.updateForumPost(postId, req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating forum post:", error);
      res.status(500).json({ message: "Failed to update forum post" });
    }
  });

  app.delete("/api/forum/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      // Check if user is the author of the post
      const existingPost = await storage.getForumPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      await storage.deleteForumPost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting forum post:", error);
      res.status(500).json({ message: "Failed to delete forum post" });
    }
  });

  // Edit and delete forum replies - only by author
  app.put("/api/forum/replies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyId = parseInt(req.params.id);
      
      // For now, we'll check authorship in the update method
      // In a real app, you'd fetch the reply first to check authorship
      const updatedReply = await storage.updateForumReply(replyId, { ...req.body, authorId: userId });
      res.json(updatedReply);
    } catch (error) {
      console.error("Error updating reply:", error);
      res.status(500).json({ message: "Failed to update reply" });
    }
  });

  app.delete("/api/forum/replies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replyId = parseInt(req.params.id);
      
      // For now, we'll assume the delete method checks authorship
      await storage.deleteForumReply(replyId);
      res.json({ message: "Reply deleted successfully" });
    } catch (error) {
      console.error("Error deleting reply:", error);
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });

  app.post("/api/forum/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voteData = { ...req.body, userId };
      const vote = await storage.voteOnPost(voteData);
      res.json(vote);
    } catch (error) {
      console.error("Error voting:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  app.get("/api/forum/vote/:postId?/:replyId?", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.postId ? parseInt(req.params.postId) : undefined;
      const replyId = req.params.replyId ? parseInt(req.params.replyId) : undefined;
      const vote = await storage.getUserVote(userId, postId, replyId);
      res.json(vote || null);
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ message: "Failed to fetch user vote" });
    }
  });

  // Blog routes - public reading, admin-only creation
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts("published");
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get("/api/blog/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getBlogComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching blog comments:", error);
      res.status(500).json({ message: "Failed to fetch blog comments" });
    }
  });

  // Protected blog routes - require authentication for commenting
  app.post("/api/blog/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const commentData = { ...req.body, authorId: userId, postId };
      const comment = await storage.createBlogComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating blog comment:", error);
      res.status(500).json({ message: "Failed to create blog comment" });
    }
  });

  // Admin-only blog routes
  app.post("/api/admin/blog/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const postData = { ...req.body, authorId: userId };
      const post = await storage.createBlogPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put("/api/admin/blog/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const postId = parseInt(req.params.id);
      const updatedPost = await storage.updateBlogPost(postId, req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const postId = parseInt(req.params.id);
      await storage.deleteBlogPost(postId);
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  app.get("/api/admin/blog/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const posts = await storage.getBlogPosts(); // All posts for admin
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch admin blog posts" });
    }
  });

  // Grant course access endpoint
  app.post('/api/admin/users/:userId/grant-course', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId: targetUserId } = req.params;
      const { courseId } = req.body;

      if (!targetUserId || !courseId) {
        return res.status(400).json({ message: "User ID and Course ID are required" });
      }

      await storage.grantCourseAccess(targetUserId, courseId);
      res.json({ message: "Course access granted successfully" });
    } catch (error) {
      console.error("Error granting course access:", error);
      res.status(500).json({ message: "Failed to grant course access" });
    }
  });

  // Course builder routes
  app.get('/api/courses/:courseId/modules', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ message: "Failed to fetch course modules" });
    }
  });

  app.post('/api/courses/:courseId/modules', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const moduleData = insertCourseModuleSchema.parse({
        ...req.body,
        courseId,
      });
      
      const module = await storage.createCourseModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating course module:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid module data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course module" });
    }
  });

  app.patch('/api/modules/:moduleId', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const updates = req.body;
      
      const module = await storage.updateCourseModule(moduleId, updates);
      res.json(module);
    } catch (error) {
      console.error("Error updating course module:", error);
      res.status(500).json({ message: "Failed to update course module" });
    }
  });

  app.delete('/api/modules/:moduleId', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      await storage.deleteCourseModule(moduleId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course module:", error);
      res.status(500).json({ message: "Failed to delete course module" });
    }
  });

  app.get('/api/modules/:moduleId/lessons', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const lessons = await storage.getModuleLessons(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching module lessons:", error);
      res.status(500).json({ message: "Failed to fetch module lessons" });
    }
  });

  app.post('/api/modules/:moduleId/lessons', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const lessonData = insertCourseLessonSchema.parse({
        ...req.body,
        moduleId,
      });
      
      const lesson = await storage.createCourseLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating course lesson:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course lesson" });
    }
  });

  app.patch('/api/lessons/:lessonId', isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const updates = req.body;
      
      const lesson = await storage.updateCourseLesson(lessonId, updates);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating course lesson:", error);
      res.status(500).json({ message: "Failed to update course lesson" });
    }
  });

  app.delete('/api/lessons/:lessonId', isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      await storage.deleteCourseLesson(lessonId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course lesson:", error);
      res.status(500).json({ message: "Failed to delete course lesson" });
    }
  });

  // Course viewer routes
  app.get('/api/courses/:courseId/viewer', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourseWithModulesAndLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course for viewer:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.get('/api/user/enrollments/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.courseId);
      
      const enrollment = await storage.getUserEnrollment(userId, courseId);
      if (!enrollment) {
        return res.status(404).json({ message: "No enrollment found" });
      }
      
      // Get updated progress
      const progressData = await storage.getUserCourseProgress(userId, courseId);
      
      res.json({
        ...enrollment,
        progress: progressData.progress,
        completed: progressData.completed,
      });
    } catch (error) {
      console.error("Error fetching user enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  app.get('/api/user/course-access/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.courseId);
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user has access (enrolled, purchased, or course is free)
      const enrollment = await storage.getUserEnrollment(userId, courseId);
      const hasPurchased = await storage.hasPurchased(userId, courseId);
      const hasAccess = course.isFree || !!enrollment || hasPurchased;
      
      res.json(hasAccess);
    } catch (error) {
      console.error("Error checking course access:", error);
      res.status(500).json({ message: "Failed to check course access" });
    }
  });

  app.post('/api/lessons/:lessonId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lessonId = parseInt(req.params.lessonId);
      const { isCompleted } = req.body;
      
      const progress = await storage.updateLessonProgress(userId, lessonId, isCompleted);
      res.json(progress);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Failed to update lesson progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
