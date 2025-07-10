import {
  users,
  courses,
  enrollments,
  purchases,
  forumPosts,
  forumReplies,
  forumVotes,
  type User,
  type UpsertUser,
  type UserWithoutPassword,
  type Course,
  type InsertCourse,
  type Enrollment,
  type InsertEnrollment,
  type Purchase,
  type InsertPurchase,
  type ForumPost,
  type InsertForumPost,
  type ForumReply,
  type InsertForumReply,
  type ForumVote,
  type InsertForumVote,
  blogPosts,
  type BlogPost,
  type InsertBlogPost,
  blogComments,
  type BlogComment,
  type InsertBlogComment,
  courseModules,
  type CourseModule,
  type InsertCourseModule,
  courseLessons,
  type CourseLesson,
  type InsertCourseLesson,
  userLessonProgress,
  type UserLessonProgress,
  type InsertUserLessonProgress,
  quizzes, type Quiz, type InsertQuiz,
  quizQuestions, type QuizQuestion, type InsertQuizQuestion,
  quizAttempts, type QuizAttempt, type InsertQuizAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - updated for local auth
  getUser(id: number): Promise<UserWithoutPassword | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: number, profile: { firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User>;
  
  // Account management operations
  getAllUsers(): Promise<User[]>;
  getAllUsersWithCourseData(): Promise<(UserWithoutPassword & { enrollments: any[], purchases: any[] })[]>;
  updateUserPermissions(userId: number, permissions: {
    canCreateBlogPosts?: boolean;
    canCreateCourses?: boolean;
    canModerateForum?: boolean;
    canManageAccounts?: boolean;
    isSuperAdmin?: boolean;
  }): Promise<User>;
  grantCourseAccess(userId: number, courseId: number): Promise<void>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  getPublishedCourses(): Promise<Course[]>;
  getFreeCourses(): Promise<Course[]>;
  getPremiumCourses(): Promise<Course[]>;
  getCoursesByCategory(category: string): Promise<Course[]>;
  
  // Enrollment operations
  enrollUser(enrollment: InsertEnrollment): Promise<Enrollment>;
  getUserEnrollments(userId: number): Promise<Enrollment[]>;
  getUserEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  updateProgress(userId: number, courseId: number, progress: number): Promise<Enrollment>;
  
  // Purchase operations
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: number): Promise<Purchase[]>;
  hasPurchased(userId: number, courseId: number): Promise<boolean>;
  
  // Forum operations
  getForumPosts(category?: string, limit?: number): Promise<(ForumPost & { authorName: string })[]>;
  getForumPost(id: number): Promise<(ForumPost & { authorName: string }) | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, updates: Partial<InsertForumPost>): Promise<ForumPost>;
  deleteForumPost(id: number): Promise<void>;
  
  getForumReplies(postId: number): Promise<(ForumReply & { authorName: string })[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  updateForumReply(id: number, updates: Partial<InsertForumReply>): Promise<ForumReply>;
  deleteForumReply(id: number): Promise<void>;
  
  voteOnPost(vote: InsertForumVote): Promise<ForumVote>;
  getUserVote(userId: number, postId?: number, replyId?: number): Promise<ForumVote | undefined>;
  removeVote(userId: number, postId?: number, replyId?: number): Promise<void>;
  
  // Blog operations
  getBlogPosts(status?: string): Promise<(BlogPost & { authorName: string })[]>;
  getBlogPost(id: number): Promise<(BlogPost & { authorName: string }) | undefined>;
  getBlogPostBySlug(slug: string): Promise<(BlogPost & { authorName: string }) | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  
  getBlogComments(postId: number): Promise<(BlogComment & { authorName: string })[]>;
  createBlogComment(comment: InsertBlogComment): Promise<BlogComment>;
  deleteBlogComment(id: number): Promise<void>;
  
  // Course builder operations
  getCourseModules(courseId: number): Promise<CourseModule[]>;
  createCourseModule(module: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: number, updates: Partial<InsertCourseModule>): Promise<CourseModule>;
  deleteCourseModule(id: number): Promise<void>;
  
  getModuleLessons(moduleId: number): Promise<CourseLesson[]>;
  getCourseLesson(lessonId: number): Promise<CourseLesson | undefined>;
  createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;
  updateCourseLesson(id: number, updates: Partial<InsertCourseLesson>): Promise<CourseLesson>;
  deleteCourseLesson(id: number): Promise<void>;
  
  // Course viewer operations
  getCourseWithModulesAndLessons(courseId: number): Promise<Course & { modules: (CourseModule & { lessons: CourseLesson[] })[] } | undefined>;
  getCourseWithModulesAndLessonsPreview(courseId: number): Promise<Course & { modules: (CourseModule & { lessons: CourseLesson[] })[] } | undefined>;
  getUserLessonProgress(userId: number, lessonId: number): Promise<UserLessonProgress | undefined>;
  updateLessonProgress(userId: number, lessonId: number, isCompleted: boolean): Promise<UserLessonProgress>;
  getUserCourseProgress(userId: number, courseId: number): Promise<{ progress: number; completed: boolean }>;
  
  // Quiz and Test operations
  getQuizzesByLesson(lessonId: number): Promise<Quiz[]>;
  getQuizzesByModule(moduleId: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, updates: Partial<InsertQuiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: number, updates: Partial<InsertQuizQuestion>): Promise<QuizQuestion>;
  deleteQuizQuestion(id: number): Promise<void>;
  
  getQuizAttempts(userId: number, quizId: number): Promise<QuizAttempt[]>;
  getLatestQuizAttempt(userId: number, quizId: number): Promise<QuizAttempt | undefined>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: number, updates: Partial<InsertQuizAttempt>): Promise<QuizAttempt>;
  
  canAccessLesson(userId: number, lessonId: number): Promise<boolean>;
  canAccessModule(userId: number, moduleId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations - updated for local auth

  async getUser(id: number): Promise<UserWithoutPassword | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isEmailVerified: users.isEmailVerified,
      canCreateBlogPosts: users.canCreateBlogPosts,
      canCreateCourses: users.canCreateCourses,
      canModerateForum: users.canModerateForum,
      canManageAccounts: users.canManageAccounts,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserProfile(userId: number, profile: { firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Account management operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllUsersWithCourseData(): Promise<(UserWithoutPassword & { enrollments: any[], purchases: any[] })[]> {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isEmailVerified: users.isEmailVerified,
      canCreateBlogPosts: users.canCreateBlogPosts,
      canCreateCourses: users.canCreateCourses,
      canModerateForum: users.canModerateForum,
      canManageAccounts: users.canManageAccounts,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(desc(users.createdAt));
    
    const usersWithData = await Promise.all(allUsers.map(async (user) => {
      try {
        // Get enrollments with course names - simplified query
        const userEnrollments = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.userId, user.id));

        // Get course names for enrollments
        const enrollmentsWithNames = await Promise.all(
          userEnrollments.map(async (enrollment) => {
            const course = await db
              .select()
              .from(courses)
              .where(eq(courses.id, enrollment.courseId))
              .limit(1);
            
            return {
              id: enrollment.id,
              courseId: enrollment.courseId,
              courseName: course[0]?.title || 'Unknown Course',
              progress: enrollment.progress,
              enrolledAt: enrollment.enrolledAt,
            };
          })
        );

        // Get purchases with course names - simplified query
        const userPurchases = await db
          .select()
          .from(purchases)
          .where(eq(purchases.userId, user.id));

        // Get course names for purchases
        const purchasesWithNames = await Promise.all(
          userPurchases.map(async (purchase) => {
            const course = await db
              .select()
              .from(courses)
              .where(eq(courses.id, purchase.courseId))
              .limit(1);
            
            return {
              id: purchase.id,
              courseId: purchase.courseId,
              courseName: course[0]?.title || 'Unknown Course',
              amount: purchase.amount,
              purchasedAt: purchase.createdAt,
            };
          })
        );

        return {
          ...user,
          enrollments: enrollmentsWithNames,
          purchases: purchasesWithNames,
        };
      } catch (error) {
        console.error(`Error fetching data for user ${user.id}:`, error);
        return {
          ...user,
          enrollments: [],
          purchases: [],
        };
      }
    }));

    return usersWithData;
  }

  async updateUserPermissions(userId: number, permissions: {
    canCreateBlogPosts?: boolean;
    canCreateCourses?: boolean;
    canModerateForum?: boolean;
    canManageAccounts?: boolean;
    isSuperAdmin?: boolean;
  }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...permissions,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async grantCourseAccess(userId: number, courseId: number): Promise<void> {
    // Check if already enrolled
    const existingEnrollment = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existingEnrollment.length === 0) {
      await db.insert(enrollments).values({
        userId,
        courseId,
        progress: 0,
      });
    }
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...courseData, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getPublishedCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(desc(courses.createdAt));
  }

  async getFreeCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(and(eq(courses.isPublished, true), eq(courses.isFree, true)))
      .orderBy(desc(courses.createdAt));
  }

  async getPremiumCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(and(eq(courses.isPublished, true), eq(courses.isPremium, true)))
      .orderBy(desc(courses.createdAt));
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(and(eq(courses.isPublished, true), eq(courses.category, category)))
      .orderBy(desc(courses.createdAt));
  }

  // Enrollment operations
  async enrollUser(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    
    // Update student count
    await db
      .update(courses)
      .set({ studentCount: sql`${courses.studentCount} + 1` })
      .where(eq(courses.id, enrollment.courseId));
    
    return newEnrollment;
  }

  async getUserEnrollments(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getUserEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async updateProgress(userId: number, courseId: number, progress: number): Promise<Enrollment> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ 
        progress,
        completed: progress >= 100,
        completedAt: progress >= 100 ? new Date() : null
      })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .returning();
    return updatedEnrollment;
  }

  // Purchase operations
  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId));
  }

  async hasPurchased(userId: number, courseId: number): Promise<boolean> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.courseId, courseId)));
    return !!purchase;
  }

  // Forum operations
  async getForumPosts(category?: string, limit = 50): Promise<(ForumPost & { authorName: string })[]> {
    const query = db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        authorId: forumPosts.authorId,
        category: forumPosts.category,
        upvotes: forumPosts.upvotes,
        replyCount: forumPosts.replyCount,
        isSticky: forumPosts.isSticky,
        isLocked: forumPosts.isLocked,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id));

    if (category) {
      query.where(eq(forumPosts.category, category));
    }

    return await query
      .orderBy(desc(forumPosts.isSticky), desc(forumPosts.createdAt))
      .limit(limit);
  }

  async getForumPost(id: number): Promise<(ForumPost & { authorName: string }) | undefined> {
    const [post] = await db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        authorId: forumPosts.authorId,
        category: forumPosts.category,
        upvotes: forumPosts.upvotes,
        replyCount: forumPosts.replyCount,
        isSticky: forumPosts.isSticky,
        isLocked: forumPosts.isLocked,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(eq(forumPosts.id, id));
    
    return post;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    return newPost;
  }

  async updateForumPost(id: number, updates: Partial<InsertForumPost>): Promise<ForumPost> {
    const [updatedPost] = await db
      .update(forumPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteForumPost(id: number): Promise<void> {
    await db.delete(forumReplies).where(eq(forumReplies.postId, id));
    await db.delete(forumVotes).where(eq(forumVotes.postId, id));
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async getForumReplies(postId: number): Promise<(ForumReply & { authorName: string })[]> {
    return await db
      .select({
        id: forumReplies.id,
        postId: forumReplies.postId,
        content: forumReplies.content,
        authorId: forumReplies.authorId,
        upvotes: forumReplies.upvotes,
        parentReplyId: forumReplies.parentReplyId,
        createdAt: forumReplies.createdAt,
        updatedAt: forumReplies.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(forumReplies.createdAt);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    const [newReply] = await db.insert(forumReplies).values(reply).returning();
    
    // Update reply count
    await db
      .update(forumPosts)
      .set({ replyCount: sql`${forumPosts.replyCount} + 1` })
      .where(eq(forumPosts.id, reply.postId));
    
    return newReply;
  }

  async updateForumReply(id: number, updates: Partial<InsertForumReply>): Promise<ForumReply> {
    const [updatedReply] = await db
      .update(forumReplies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forumReplies.id, id))
      .returning();
    return updatedReply;
  }

  async deleteForumReply(id: number): Promise<void> {
    const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, id));
    if (reply) {
      await db.delete(forumVotes).where(eq(forumVotes.replyId, id));
      await db.delete(forumReplies).where(eq(forumReplies.id, id));
      
      // Update reply count
      await db
        .update(forumPosts)
        .set({ replyCount: sql`${forumPosts.replyCount} - 1` })
        .where(eq(forumPosts.id, reply.postId));
    }
  }

  async voteOnPost(vote: InsertForumVote): Promise<ForumVote> {
    // Remove existing vote first
    if (vote.postId) {
      await this.removeVote(vote.userId, vote.postId);
    } else if (vote.replyId) {
      await this.removeVote(vote.userId, undefined, vote.replyId);
    }

    const [newVote] = await db.insert(forumVotes).values(vote).returning();
    
    // Update vote count
    if (vote.postId) {
      const increment = vote.voteType === 'upvote' ? 1 : -1;
      await db
        .update(forumPosts)
        .set({ upvotes: sql`${forumPosts.upvotes} + ${increment}` })
        .where(eq(forumPosts.id, vote.postId));
    } else if (vote.replyId) {
      const increment = vote.voteType === 'upvote' ? 1 : -1;
      await db
        .update(forumReplies)
        .set({ upvotes: sql`${forumReplies.upvotes} + ${increment}` })
        .where(eq(forumReplies.id, vote.replyId));
    }
    
    return newVote;
  }

  async getUserVote(userId: number, postId?: number, replyId?: number): Promise<ForumVote | undefined> {
    let whereCondition;
    if (postId) {
      whereCondition = and(eq(forumVotes.userId, userId), eq(forumVotes.postId, postId));
    } else if (replyId) {
      whereCondition = and(eq(forumVotes.userId, userId), eq(forumVotes.replyId, replyId));
    } else {
      return undefined;
    }

    const [vote] = await db.select().from(forumVotes).where(whereCondition);
    return vote;
  }

  async removeVote(userId: number, postId?: number, replyId?: number): Promise<void> {
    let whereCondition;
    if (postId) {
      whereCondition = and(eq(forumVotes.userId, userId), eq(forumVotes.postId, postId));
    } else if (replyId) {
      whereCondition = and(eq(forumVotes.userId, userId), eq(forumVotes.replyId, replyId));
    } else {
      return;
    }

    const [existingVote] = await db.select().from(forumVotes).where(whereCondition);
    if (existingVote) {
      await db.delete(forumVotes).where(whereCondition);
      
      // Update vote count
      if (existingVote.postId) {
        const decrement = existingVote.voteType === 'upvote' ? -1 : 1;
        await db
          .update(forumPosts)
          .set({ upvotes: sql`${forumPosts.upvotes} + ${decrement}` })
          .where(eq(forumPosts.id, existingVote.postId));
      } else if (existingVote.replyId) {
        const decrement = existingVote.voteType === 'upvote' ? -1 : 1;
        await db
          .update(forumReplies)
          .set({ upvotes: sql`${forumReplies.upvotes} + ${decrement}` })
          .where(eq(forumReplies.id, existingVote.replyId));
      }
    }
  }

  // Blog operations
  async getBlogPosts(status = "published"): Promise<(BlogPost & { authorName: string })[]> {
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        authorId: blogPosts.authorId,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.status, status))
      .orderBy(desc(blogPosts.publishedAt));
    
    return posts;
  }

  async getBlogPost(id: number): Promise<(BlogPost & { authorName: string }) | undefined> {
    const [post] = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        authorId: blogPosts.authorId,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.id, id));
    
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<(BlogPost & { authorName: string }) | undefined> {
    const [post] = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        authorId: blogPosts.authorId,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.slug, slug));
    
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getBlogComments(postId: number): Promise<(BlogComment & { authorName: string })[]> {
    const comments = await db
      .select({
        id: blogComments.id,
        postId: blogComments.postId,
        authorId: blogComments.authorId,
        content: blogComments.content,
        parentCommentId: blogComments.parentCommentId,
        createdAt: blogComments.createdAt,
        updatedAt: blogComments.updatedAt,
        authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`.as('authorName'),
      })
      .from(blogComments)
      .leftJoin(users, eq(blogComments.authorId, users.id))
      .where(eq(blogComments.postId, postId))
      .orderBy(blogComments.createdAt);
    
    return comments;
  }

  async createBlogComment(comment: InsertBlogComment): Promise<BlogComment> {
    const [newComment] = await db.insert(blogComments).values(comment).returning();
    return newComment;
  }

  async deleteBlogComment(id: number): Promise<void> {
    await db.delete(blogComments).where(eq(blogComments.id, id));
  }

  // Course builder operations
  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(courseModules.orderIndex);
  }

  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> {
    const [created] = await db.insert(courseModules).values(module).returning();
    return created;
  }

  async updateCourseModule(id: number, updates: Partial<InsertCourseModule>): Promise<CourseModule> {
    const [updated] = await db.update(courseModules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courseModules.id, id))
      .returning();
    return updated;
  }

  async deleteCourseModule(id: number): Promise<void> {
    await db.delete(courseModules).where(eq(courseModules.id, id));
  }

  async getModuleLessons(moduleId: number): Promise<CourseLesson[]> {
    return await db.select().from(courseLessons)
      .where(eq(courseLessons.moduleId, moduleId))
      .orderBy(courseLessons.orderIndex);
  }

  async getCourseLesson(lessonId: number): Promise<CourseLesson | undefined> {
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId));
    return lesson;
  }

  async createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    const [created] = await db.insert(courseLessons).values(lesson).returning();
    return created;
  }

  async updateCourseLesson(id: number, updates: Partial<InsertCourseLesson>): Promise<CourseLesson> {
    const [updated] = await db.update(courseLessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courseLessons.id, id))
      .returning();
    return updated;
  }

  async deleteCourseLesson(id: number): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
  }

  // Course viewer operations (only published content)
  async getCourseWithModulesAndLessons(courseId: number): Promise<Course & { modules: (CourseModule & { lessons: CourseLesson[] })[] } | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;

    // Only get PUBLISHED modules for regular course viewer
    const modules = await db.select().from(courseModules)
      .where(and(
        eq(courseModules.courseId, courseId),
        eq(courseModules.isPublished, true)
      ))
      .orderBy(courseModules.orderIndex);

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        // Only get PUBLISHED lessons for regular course viewer
        const lessons = await db.select().from(courseLessons)
          .where(and(
            eq(courseLessons.moduleId, module.id),
            eq(courseLessons.isPublished, true)
          ))
          .orderBy(courseLessons.orderIndex);
        return { ...module, lessons };
      })
    );

    return { ...course, modules: modulesWithLessons };
  }

  async getCourseWithModulesAndLessonsPreview(courseId: number): Promise<Course & { modules: (CourseModule & { lessons: CourseLesson[] })[] } | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;

    // Get ALL modules (including drafts) for preview
    const modules = await db.select().from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(courseModules.orderIndex);

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        // Get ALL lessons (including drafts) for preview
        const lessons = await db.select().from(courseLessons)
          .where(eq(courseLessons.moduleId, module.id))
          .orderBy(courseLessons.orderIndex);
        return { ...module, lessons };
      })
    );

    return { ...course, modules: modulesWithLessons };
  }

  async getUserLessonProgress(userId: number, lessonId: number): Promise<UserLessonProgress | undefined> {
    const [progress] = await db.select().from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.lessonId, lessonId)
      ));
    return progress;
  }

  async updateLessonProgress(userId: number, lessonId: number, isCompleted: boolean): Promise<UserLessonProgress> {
    const existing = await this.getUserLessonProgress(userId, lessonId);
    
    if (existing) {
      const [updated] = await db.update(userLessonProgress)
        .set({ 
          isCompleted, 
          completedAt: isCompleted ? new Date() : null,
          updatedAt: new Date() 
        })
        .where(and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.lessonId, lessonId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userLessonProgress)
        .values({
          userId,
          lessonId,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        })
        .returning();
      return created;
    }
  }

  async getUserCourseProgress(userId: number, courseId: number): Promise<{ progress: number; completed: boolean }> {
    // Get all lessons for the course
    const modules = await db.select().from(courseModules)
      .where(eq(courseModules.courseId, courseId));
    
    const allLessons = [];
    for (const module of modules) {
      const lessons = await db.select().from(courseLessons)
        .where(eq(courseLessons.moduleId, module.id));
      allLessons.push(...lessons);
    }

    if (allLessons.length === 0) {
      return { progress: 0, completed: false };
    }

    // Get user progress for all lessons
    const completedLessons = await db.select().from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.isCompleted, true)
      ));

    const completedLessonIds = new Set(completedLessons.map(p => p.lessonId));
    const courseCompletedLessons = allLessons.filter(lesson => completedLessonIds.has(lesson.id));
    
    const progress = Math.round((courseCompletedLessons.length / allLessons.length) * 100);
    const completed = progress === 100;

    return { progress, completed };
  }

  // Quiz and Test operations
  async getQuizzesByLesson(lessonId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
  }

  async getQuizzesByModule(moduleId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.moduleId, moduleId));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [createdQuiz] = await db.insert(quizzes).values(quiz).returning();
    return createdQuiz;
  }

  async updateQuiz(id: number, updates: Partial<InsertQuiz>): Promise<Quiz> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(quizQuestions.orderIndex);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [createdQuestion] = await db.insert(quizQuestions).values(question).returning();
    return createdQuestion;
  }

  async updateQuizQuestion(id: number, updates: Partial<InsertQuizQuestion>): Promise<QuizQuestion> {
    const [updatedQuestion] = await db
      .update(quizQuestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quizQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuizQuestion(id: number): Promise<void> {
    await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
  }

  async getQuizAttempts(userId: number, quizId: number): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.createdAt));
  }

  async getLatestQuizAttempt(userId: number, quizId: number): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(1);
    return attempt;
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [createdAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return createdAttempt;
  }

  async updateQuizAttempt(id: number, updates: Partial<InsertQuizAttempt>): Promise<QuizAttempt> {
    const [updatedAttempt] = await db
      .update(quizAttempts)
      .set(updates)
      .where(eq(quizAttempts.id, id))
      .returning();
    return updatedAttempt;
  }

  async canAccessLesson(userId: number, lessonId: number): Promise<boolean> {
    // Check if user has passed the previous lesson's quiz (if it exists)
    const lesson = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId)).limit(1);
    if (!lesson.length) return false;
    
    const previousLessons = await db.select().from(courseLessons)
      .where(and(
        eq(courseLessons.moduleId, lesson[0].moduleId),
        sql`${courseLessons.orderIndex} < ${lesson[0].orderIndex}`
      ))
      .orderBy(desc(courseLessons.orderIndex))
      .limit(1);
    
    if (!previousLessons.length) return true; // First lesson in module
    
    const previousQuiz = await db.select().from(quizzes)
      .where(eq(quizzes.lessonId, previousLessons[0].id))
      .limit(1);
    
    if (!previousQuiz.length) return true; // No quiz for previous lesson
    
    const latestAttempt = await this.getLatestQuizAttempt(userId, previousQuiz[0].id);
    return latestAttempt?.passed || false;
  }

  async canAccessModule(userId: number, moduleId: number): Promise<boolean> {
    // Check if user has passed the previous module's test (if it exists)
    const module = await db.select().from(courseModules).where(eq(courseModules.id, moduleId)).limit(1);
    if (!module.length) return false;
    
    const previousModules = await db.select().from(courseModules)
      .where(and(
        eq(courseModules.courseId, module[0].courseId),
        sql`${courseModules.orderIndex} < ${module[0].orderIndex}`
      ))
      .orderBy(desc(courseModules.orderIndex))
      .limit(1);
    
    if (!previousModules.length) return true; // First module in course
    
    const previousTest = await db.select().from(quizzes)
      .where(eq(quizzes.moduleId, previousModules[0].id))
      .limit(1);
    
    if (!previousTest.length) return true; // No test for previous module
    
    const latestAttempt = await this.getLatestQuizAttempt(userId, previousTest[0].id);
    return latestAttempt?.passed || false;
  }
}

export const storage = new DatabaseStorage();
