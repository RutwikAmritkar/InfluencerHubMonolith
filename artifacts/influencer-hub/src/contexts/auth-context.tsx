import { createContext, useContext, useEffect, useState } from "react";
import { User, useGetMe, useLogout } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: meData, isLoading: meLoading, isError } = useGetMe({
    query: {
      retry: false,
      throwOnError: false,
    } as any
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    if (!meLoading) {
      if (meData && typeof meData === "object" && "user" in (meData as any) && (meData as any).user) {
        setUser((meData as any).user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [meData, meLoading, isError]);

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setUser(null);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isLoading: false,
      setUser: () => {},
      logout: () => {},
    };
  }
  return context;
}
