import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useGetMe, useLogout } from "@workspace/api-client-react";

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
    }
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    if (!meLoading) {
      if (meData?.user) {
        setUser(meData.user);
      } else if (isError) {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [meData, meLoading, isError]);

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
