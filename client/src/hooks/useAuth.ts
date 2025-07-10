import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check Replit Auth first
  const { data: replitUser, isLoading: isLoadingReplit, error: replitError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Only check local auth if Replit auth failed
  const shouldCheckLocal = Boolean(!isLoadingReplit && !replitUser && replitError);
  
  const { data: localUser, isLoading: isLoadingLocal } = useQuery({
    queryKey: ["/api/auth/local-user"],
    retry: false,
    enabled: shouldCheckLocal,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const user = replitUser || localUser;
  const isLoading = isLoadingReplit || (shouldCheckLocal && isLoadingLocal);
  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    authType: replitUser ? 'replit' : localUser ? 'local' : null,
  };
}
