import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check for Replit Auth user first
  const { data: replitUser, isLoading: isLoadingReplit } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // If Replit user exists, use that and don't check local auth
  if (replitUser) {
    return {
      user: replitUser,
      isLoading: isLoadingReplit,
      isAuthenticated: true,
      authType: 'replit',
    };
  }

  // Only check local auth if no Replit user and not loading
  const { data: localUser, isLoading: isLoadingLocal } = useQuery({
    queryKey: ["/api/auth/local-user"],
    retry: false,
    enabled: !isLoadingReplit && !replitUser,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  return {
    user: localUser || null,
    isLoading: isLoadingReplit || isLoadingLocal,
    isAuthenticated: !!localUser,
    authType: localUser ? 'local' : null,
  };
}
