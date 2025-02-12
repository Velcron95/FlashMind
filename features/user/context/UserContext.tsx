import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { PremiumManagementService } from "@/features/premium/services/premiumManagementService";

interface UserData {
  id: string | null;
  email: string | null;
  avatar_url: string | null;
  isAdmin: boolean;
}

interface UserContextType {
  userData: UserData;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userData: { id: null, email: null, avatar_url: null, isAdmin: false },
  isLoading: true,
  refreshUserData: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData>({
    id: null,
    email: null,
    avatar_url: null,
    isAdmin: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [profile, isAdmin] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          PremiumManagementService.isUserAdmin(user.id),
        ]);

        setUserData({
          id: user.id,
          email: user.email || null,
          avatar_url: profile.data?.avatar_url || null,
          isAdmin,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ userData, isLoading, refreshUserData: fetchUserData }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
