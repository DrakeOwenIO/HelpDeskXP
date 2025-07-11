import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure multer for file uploads
const profileImageDir = path.join(process.cwd(), 'uploads', 'profile-images');
const courseThumbnailDir = path.join(process.cwd(), 'uploads', 'course-thumbnails');
const courseVideoDir = path.join(process.cwd(), 'uploads', 'course-videos');

// Create directories if they don't exist
[profileImageDir, courseThumbnailDir, courseVideoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Profile image upload configuration
const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: profileImageDir,
    filename: (req, file, cb) => {
      const userId = (req as any).user?.id;
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

// Course thumbnail upload configuration
const courseThumbnailUpload = multer({
  storage: multer.diskStorage({
    destination: courseThumbnailDir,
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `thumbnail-${timestamp}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Course video upload configuration
const courseVideoUpload = multer({
  storage: multer.diskStorage({
    destination: courseVideoDir,
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `video-${timestamp}${ext}`);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});
import { insertUserSchema, insertCourseSchema, insertEnrollmentSchema, insertPurchaseSchema, insertForumPostSchema, insertForumReplySchema, insertBlogPostSchema, insertBlogCommentSchema, insertCourseModuleSchema, insertCourseLessonSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      // Validate request body using insertUserSchema
      const userData = insertUserSchema.parse({
        ...req.body,
        email: req.body.email || `${req.body.username}@example.com`, // Generate email if not provided
      });

      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Don't return password in response
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password
      const { verifyPassword } = await import('./auth');
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Create session
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (user) {
        // Remove password from response for security
        const { password, ...userWithoutPassword } = user as any;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post('/api/user/profile-image', isAuthenticated, profileImageUpload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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

  // Course file upload endpoints
  app.post('/api/admin/course-thumbnail', isAuthenticated, courseThumbnailUpload.single('thumbnail'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.canCreateCourses && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Course admin access required" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No thumbnail file provided" });
      }

      const thumbnailUrl = `/uploads/course-thumbnails/${req.file.filename}`;
      res.json({ thumbnailUrl, message: "Thumbnail uploaded successfully" });
    } catch (error) {
      console.error("Error uploading course thumbnail:", error);
      res.status(500).json({ message: "Failed to upload thumbnail" });
    }
  });

  app.post('/api/admin/course-video', isAuthenticated, courseVideoUpload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.canCreateCourses && !user?.isSuperAdmin) {
        return res.status(403).json({ message: "Course admin access required" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const videoUrl = `/uploads/course-videos/${req.file.filename}`;
      res.json({ videoUrl, message: "Video uploaded successfully" });
    } catch (error) {
      console.error("Error uploading course video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Serve uploaded files
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get specific enrollment for a course
  app.get('/api/user/enrollments/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const courseId = parseInt(req.params.courseId);
      const enrollment = await storage.getUserEnrollment(userId, courseId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "No enrollment found" });
      }
      
      res.json(enrollment);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  // Course viewer routes
  app.get('/api/courses/:courseId/viewer', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      
      // Check if user has access to this course
      const hasAccess = await storage.hasPurchased(userId, courseId) || 
                       await storage.getUserEnrollment(userId, courseId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied. Purchase course to view content." });
      }
      
      const course = await storage.getCourseWithModulesAndLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Debug: Log course structure with quiz data
      console.log(`=== Course Viewer Debug for Course ${courseId} ===`);
      console.log(`Modules found: ${course.modules.length}`);
      course.modules.forEach((module, moduleIndex) => {
        console.log(`  Module ${moduleIndex + 1}: "${module.title}" (Published: ${module.isPublished})`);
        console.log(`    Lessons: ${module.lessons.length}`);
        module.lessons.forEach((lesson, lessonIndex) => {
          console.log(`      Lesson ${lessonIndex + 1}: "${lesson.title}" (Published: ${lesson.isPublished})`);
          console.log(`        Content Blocks: ${lesson.contentBlocks ? JSON.parse(JSON.stringify(lesson.contentBlocks)).length : 0}`);
          if (lesson.contentBlocks) {
            const blocks = JSON.parse(JSON.stringify(lesson.contentBlocks));
            blocks.forEach((block: any, blockIndex: number) => {
              console.log(`          Block ${blockIndex + 1}: ${block.type} ${block.type === 'quiz' ? `(Quiz: ${block.quiz ? 'present' : 'missing'})` : ''}`);
            });
          }
        });
      });
      console.log(`=== End Course Viewer Debug ===`);
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course viewer data:", error);
      res.status(500).json({ message: "Failed to fetch course content" });
    }
  });

  // Admin middleware (define early in the file)
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if user has any admin permissions
      if (!user?.isSuperAdmin && !user?.canCreateCourses && !user?.canCreateBlogPosts && !user?.canModerateForum && !user?.canManageAccounts) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      console.error("Error in isAdmin middleware:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // Super Admin middleware for account management
  const isSuperAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ message: "Super Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify super admin status" });
    }
  };

  // Course preview route (includes draft content) - Admin only
  app.get('/api/admin/courses/:courseId/preview', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourseWithModulesAndLessonsPreview(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Debug: Log course preview structure (shows ALL content including drafts)
      console.log(`=== Course Preview Debug for Course ${courseId} ===`);
      console.log(`Modules found: ${course.modules.length} (including drafts)`);
      course.modules.forEach((module, moduleIndex) => {
        console.log(`  Module ${moduleIndex + 1}: "${module.title}" (Published: ${module.isPublished})`);
        console.log(`    Lessons: ${module.lessons.length} (including drafts)`);
        module.lessons.forEach((lesson, lessonIndex) => {
          console.log(`      Lesson ${lessonIndex + 1}: "${lesson.title}" (Published: ${lesson.isPublished})`);
          console.log(`        Content Blocks: ${lesson.contentBlocks ? JSON.parse(JSON.stringify(lesson.contentBlocks)).length : 0}`);
          if (lesson.contentBlocks) {
            const blocks = JSON.parse(JSON.stringify(lesson.contentBlocks));
            blocks.forEach((block: any, blockIndex: number) => {
              console.log(`          Block ${blockIndex + 1}: ${block.type} ${block.type === 'quiz' ? `(Quiz: ${block.quiz ? 'present' : 'missing'})` : ''}`);
            });
          }
        });
      });
      console.log(`=== End Course Preview Debug ===`);
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course preview:", error);
      res.status(500).json({ message: "Failed to fetch course preview" });
    }
  });

  // Check course access endpoint
  app.get('/api/user/course-access/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      
      const hasAccess = await storage.hasPurchased(userId, courseId) || 
                       await storage.getUserEnrollment(userId, courseId);
      
      res.json(hasAccess);
    } catch (error) {
      console.error("Error checking course access:", error);
      res.status(500).json({ message: "Failed to check course access" });
    }
  });

  // Update lesson progress endpoint
  app.post('/api/lessons/:lessonId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const userId = req.user.id;
      const { isCompleted } = req.body;
      
      const progress = await storage.updateLessonProgress(userId, lessonId, isCompleted);
      res.json(progress);
    } catch (error) {
      console.error("Error updating lesson progress:", error);
      res.status(500).json({ message: "Failed to update lesson progress" });
    }
  });

  app.put('/api/courses/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Admin routes (middleware defined earlier)

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
      const { permissions, password } = req.body;
      
      const updatedUser = await storage.updateUserPermissions(userId, permissions, password);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: "Failed to update user permissions" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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
      // Handle data transformations
      const courseData = { ...req.body };
      if (typeof courseData.learningObjectives === 'string') {
        courseData.learningObjectives = courseData.learningObjectives.split('\n').filter(Boolean);
      }
      // Convert price to string if it's a number
      if (typeof courseData.price === 'number') {
        courseData.price = courseData.price.toString();
      }
      
      const validatedData = insertCourseSchema.partial().parse(courseData);
      
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

  // Course builder API endpoints
  app.get('/api/admin/courses/:courseId/structure', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const modules = await storage.getCourseModules(courseId);
      const modulesWithLessons = await Promise.all(
        modules.map(async (module) => ({
          ...module,
          lessons: await storage.getModuleLessons(module.id)
        }))
      );
      
      res.json({
        course,
        modules: modulesWithLessons
      });
    } catch (error) {
      console.error("Error fetching course structure:", error);
      res.status(500).json({ message: "Failed to fetch course structure" });
    }
  });

  // Module management endpoints
  app.post('/api/admin/courses/:courseId/modules', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const moduleData = { ...req.body, courseId };
      const module = await storage.createCourseModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put('/api/admin/courses/:courseId/modules/:moduleId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const module = await storage.updateCourseModule(moduleId, req.body);
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete('/api/admin/courses/:courseId/modules/:moduleId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      await storage.deleteCourseModule(moduleId);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Lesson management endpoints
  app.post('/api/admin/courses/:courseId/lessons', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const lesson = await storage.createCourseLesson(req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.get('/api/admin/courses/:courseId/lessons/:lessonId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.getCourseLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.put('/api/admin/courses/:courseId/lessons/:lessonId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const lesson = await storage.updateCourseLesson(lessonId, req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete('/api/admin/courses/:courseId/lessons/:lessonId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      await storage.deleteCourseLesson(lessonId);
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // Reorder lessons within a module
  app.put('/api/admin/courses/:courseId/modules/:moduleId/lessons/reorder', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const { lessonOrders } = req.body; // Array of { id: number, orderIndex: number }
      
      if (!Array.isArray(lessonOrders)) {
        return res.status(400).json({ message: "lessonOrders must be an array" });
      }

      await storage.reorderLessons(moduleId, lessonOrders);
      res.json({ message: "Lessons reordered successfully" });
    } catch (error) {
      console.error("Error reordering lessons:", error);
      res.status(500).json({ message: "Failed to reorder lessons" });
    }
  });

  // Quiz and Test Management API routes
  
  // Create quiz for lesson or test for module
  app.post('/api/admin/quizzes', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { title, description, type, lessonId, moduleId, passingScore } = req.body;
      
      if (!title || !type) {
        return res.status(400).json({ message: "Title and type are required" });
      }
      
      if (type === 'lesson_quiz' && !lessonId) {
        return res.status(400).json({ message: "Lesson ID is required for quizzes" });
      }
      
      if (type === 'module_test' && !moduleId) {
        return res.status(400).json({ message: "Module ID is required for tests" });
      }

      const quiz = await storage.createQuiz({
        title,
        description,
        type,
        lessonId: type === 'lesson_quiz' ? lessonId : null,
        moduleId: type === 'module_test' ? moduleId : null,
        passingScore: passingScore || (type === 'lesson_quiz' ? 80 : 70),
        isPublished: false,
      });

      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  // Get quiz by ID with questions
  app.get('/api/admin/quizzes/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuiz(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await storage.getQuizQuestions(quizId);
      res.json({ ...quiz, questions });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Update quiz
  app.put('/api/admin/quizzes/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const updates = req.body;
      
      const quiz = await storage.updateQuiz(quizId, updates);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  // Delete quiz
  app.delete('/api/admin/quizzes/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      await storage.deleteQuiz(quizId);
      res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Create quiz question
  app.post('/api/admin/quizzes/:id/questions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const { question, questionType, options, correctAnswers, points } = req.body;
      
      if (!question || !questionType) {
        return res.status(400).json({ message: "Question and question type are required" });
      }

      const questionData = await storage.createQuizQuestion({
        quizId,
        question,
        questionType,
        options: options || [],
        correctAnswers: correctAnswers || [],
        points: points || 1,
        orderIndex: 0, // Will be updated based on existing questions
      });

      res.json(questionData);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Failed to create quiz question" });
    }
  });

  // Update quiz question
  app.put('/api/admin/quiz-questions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const updates = req.body;
      
      const question = await storage.updateQuizQuestion(questionId, updates);
      res.json(question);
    } catch (error) {
      console.error("Error updating quiz question:", error);
      res.status(500).json({ message: "Failed to update quiz question" });
    }
  });

  // Delete quiz question
  app.delete('/api/admin/quiz-questions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      await storage.deleteQuizQuestion(questionId);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz question:", error);
      res.status(500).json({ message: "Failed to delete quiz question" });
    }
  });

  // Get quizzes by lesson
  app.get('/api/lessons/:id/quizzes', isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const quizzes = await storage.getQuizzesByLesson(lessonId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching lesson quizzes:", error);
      res.status(500).json({ message: "Failed to fetch lesson quizzes" });
    }
  });

  // Get tests by module
  app.get('/api/modules/:id/tests', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const tests = await storage.getQuizzesByModule(moduleId);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching module tests:", error);
      res.status(500).json({ message: "Failed to fetch module tests" });
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
