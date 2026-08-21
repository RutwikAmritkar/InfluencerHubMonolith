import { createContext, useContext, useEffect, useState } from "react";
import { User, useGetMe, useLogout } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "influencer_hub_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_err) {
      // Ignore storage write errors
    }
  };

  const { data: meData, isLoading: meLoading, isError } = useGetMe({
    query: {
      retry: false,
    } as any
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    if (!meLoading) {
      if (meData?.user) {
        setUser(meData.user);
      } else if (isError) {
        try {
          if (!localStorage.getItem(STORAGE_KEY)) {
            setUserState(null);
          }
        } catch (_err) {
          setUserState(null);
        }
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
