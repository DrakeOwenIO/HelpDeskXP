import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createSuperAdmin() {
  try {
    console.log('Creating Drake Owen super admin user...');
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, 'drake@helpdeskxp.com'));
    
    if (existingUser.length > 0) {
      console.log('Super admin user already exists');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('securepassword123', 10);
    
    // Create the super admin user
    const [newUser] = await db.insert(users).values({
      username: 'drakeowner',
      email: 'drake@helpdeskxp.com',
      password: hashedPassword,
      firstName: 'Drake',
      lastName: 'Owen',
      canCreateBlogPosts: true,
      canCreateCourses: true,
      canModerateForum: true,
      canManageAccounts: true,
      isSuperAdmin: true,
      isPremium: true,
      isAdmin: true,
    }).returning();
    
    console.log('Super admin user created successfully:', {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      isSuperAdmin: newUser.isSuperAdmin
    });
    
  } catch (error) {
    console.error('Error creating super admin user:', error);
  } finally {
    process.exit(0);
  }
}

createSuperAdmin();