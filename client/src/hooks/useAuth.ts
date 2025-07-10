import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Always call both hooks to avoid violating Rules of Hooks
  const { data: replitUser, isLoading: isLoadingReplit } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const { data: localUser, isLoading: isLoadingLocal } = useQuery({
    queryKey: ["/api/auth/local-user"],
    retry: false,
    enabled: !isLoadingReplit && !replitUser,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Determine which user to use (prefer Replit if both are available)
  const user = replitUser || localUser;
  const isLoading = isLoadingReplit || isLoadingLocal;
  const isAuthenticated = !!user;

  // Determine auth type
  let authType = null;
  if (replitUser) {
    authType = 'replit';
  } else if (localUser) {
    authType = 'local';
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    authType,
  };
}
