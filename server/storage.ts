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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  getUserEnrollments(userId: string): Promise<Enrollment[]>;
  getUserEnrollment(userId: string, courseId: number): Promise<Enrollment | undefined>;
  updateProgress(userId: string, courseId: number, progress: number): Promise<Enrollment>;
  
  // Purchase operations
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: string): Promise<Purchase[]>;
  hasPurchased(userId: string, courseId: number): Promise<boolean>;
  
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
  getUserVote(userId: string, postId?: number, replyId?: number): Promise<ForumVote | undefined>;
  removeVote(userId: string, postId?: number, replyId?: number): Promise<void>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getUserEnrollment(userId: string, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async updateProgress(userId: string, courseId: number, progress: number): Promise<Enrollment> {
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

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId));
  }

  async hasPurchased(userId: string, courseId: number): Promise<boolean> {
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

  async getUserVote(userId: string, postId?: number, replyId?: number): Promise<ForumVote | undefined> {
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

  async removeVote(userId: string, postId?: number, replyId?: number): Promise<void> {
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
}

export const storage = new DatabaseStorage();
