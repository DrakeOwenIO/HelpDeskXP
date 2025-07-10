import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Shield, User, Edit, Eye, Trash2, Settings } from "lucide-react";
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  canCreateBlogPosts: boolean;
  canCreateCourses: boolean;
  canModerateForum: boolean;
  canManageAccounts: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
}

interface UserPermissions {
  canCreateBlogPosts: boolean;
  canCreateCourses: boolean;
  canModerateForum: boolean;
  canManageAccounts: boolean;
  isSuperAdmin: boolean;
}

const PermissionBadge = ({ permission, label, icon: Icon }: {
  permission: boolean;
  label: string;
  icon: any;
}) => (
  <Badge variant={permission ? "default" : "secondary"} className="flex items-center gap-1">
    <Icon className="w-3 h-3" />
    {label}
  </Badge>
);

const UserPermissionsCard = ({ user, onUpdate }: {
  user: User;
  onUpdate: (userId: string, permissions: UserPermissions) => void;
}) => {
  const [permissions, setPermissions] = useState<UserPermissions>({
    canCreateBlogPosts: user.canCreateBlogPosts,
    canCreateCourses: user.canCreateCourses,
    canModerateForum: user.canModerateForum,
    canManageAccounts: user.canManageAccounts,
    isSuperAdmin: user.isSuperAdmin,
  });

  const [isEditing, setIsEditing] = useState(false);

  const hasChanges = JSON.stringify(permissions) !== JSON.stringify({
    canCreateBlogPosts: user.canCreateBlogPosts,
    canCreateCourses: user.canCreateCourses,
    canModerateForum: user.canModerateForum,
    canManageAccounts: user.canManageAccounts,
    isSuperAdmin: user.isSuperAdmin,
  });

  const handleSave = () => {
    onUpdate(user.id, permissions);
    setIsEditing(false);
  };

  const getUserType = () => {
    if (user.isSuperAdmin) return "Super Admin";
    const roleCount = [
      user.canCreateBlogPosts,
      user.canCreateCourses,
      user.canModerateForum,
      user.canManageAccounts
    ].filter(Boolean).length;
    
    if (roleCount === 0) return "Member";
    if (roleCount === 1) {
      if (user.canCreateBlogPosts) return "Blog Admin";
      if (user.canCreateCourses) return "Course Admin";
      if (user.canModerateForum) return "Forum Moderator";
      if (user.canManageAccounts) return "Account Manager";
    }
    return "Multiple Roles";
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">
                {user.firstName || user.lastName ? 
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                  'Unnamed User'
                }
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant="outline" className="mt-1">
                {getUserType()}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4 mr-1" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${user.id}-blog`}
                  checked={permissions.canCreateBlogPosts}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({ ...prev, canCreateBlogPosts: !!checked }))
                  }
                />
                <label htmlFor={`${user.id}-blog`} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Blog Admin
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${user.id}-course`}
                  checked={permissions.canCreateCourses}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({ ...prev, canCreateCourses: !!checked }))
                  }
                />
                <label htmlFor={`${user.id}-course`} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Course Admin
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${user.id}-forum`}
                  checked={permissions.canModerateForum}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({ ...prev, canModerateForum: !!checked }))
                  }
                />
                <label htmlFor={`${user.id}-forum`} className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Forum Moderator
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${user.id}-accounts`}
                  checked={permissions.canManageAccounts}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({ ...prev, canManageAccounts: !!checked }))
                  }
                />
                <label htmlFor={`${user.id}-accounts`} className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Account Manager
                </label>
              </div>

              <div className="flex items-center space-x-2 md:col-span-2">
                <Checkbox
                  id={`${user.id}-super`}
                  checked={permissions.isSuperAdmin}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({ ...prev, isSuperAdmin: !!checked }))
                  }
                />
                <label htmlFor={`${user.id}-super`} className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Super Admin (Full Access)
                </label>
              </div>
            </div>

            {hasChanges && (
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <PermissionBadge
              permission={user.isSuperAdmin}
              label="Super Admin"
              icon={Shield}
            />
            <PermissionBadge
              permission={user.canCreateBlogPosts}
              label="Blog Admin"
              icon={Edit}
            />
            <PermissionBadge
              permission={user.canCreateCourses}
              label="Course Admin"
              icon={Eye}
            />
            <PermissionBadge
              permission={user.canModerateForum}
              label="Forum Moderator"
              icon={Trash2}
            />
            <PermissionBadge
              permission={user.canManageAccounts}
              label="Account Manager"
              icon={Settings}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AccountManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: UserPermissions }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}/permissions`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User permissions updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update user permissions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePermissions = (userId: string, permissions: UserPermissions) => {
    updatePermissionsMutation.mutate({ userId, permissions });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">Account Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div>
                    <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-6 bg-muted rounded w-16"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground">
            Manage user permissions and access levels
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permission Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Member</h4>
                <p className="text-muted-foreground">Standard account with no admin access</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Blog Admin</h4>
                <p className="text-muted-foreground">Can create and manage blog posts</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Course Admin</h4>
                <p className="text-muted-foreground">Can create and manage courses</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Forum Moderator</h4>
                <p className="text-muted-foreground">Can delete other users' posts but can't edit</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Account Manager</h4>
                <p className="text-muted-foreground">Can manage user permissions (not implemented yet)</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Super Admin</h4>
                <p className="text-muted-foreground">Has all permissions and access to account management</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Users ({users?.length || 0})</h2>
        {users?.map((user: User) => (
          <UserPermissionsCard
            key={user.id}
            user={user}
            onUpdate={handleUpdatePermissions}
          />
        ))}
      </div>
    </div>
  );
}