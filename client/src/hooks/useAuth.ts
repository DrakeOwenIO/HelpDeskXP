import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Always try both auth methods to avoid conditional hooks
  const { data: replitUser, isLoading: isLoadingReplit, error: replitError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: localUser, isLoading: isLoadingLocal, error: localError } = useQuery({
    queryKey: ["/api/auth/local-user"],
    retry: false,
  });

  // Determine which user to use (prefer Replit if both are available)
  const user = replitUser || localUser;
  const isLoading = isLoadingReplit || isLoadingLocal;
  const isAuthenticated = !!user;

  // Determine auth type
  let authType = null;
  if (replitUser && !replitError) {
    authType = 'replit';
  } else if (localUser && !localError) {
    authType = 'local';
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    authType,
  };
}
