import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { PremiumManagementService } from "@/features/premium/services/premiumManagementService";

interface UserData {
  id: string | null;
  email: string | null;
  avatar_url: string | null;
  isAdmin: boolean;
  display_name: string | null;
}

interface UserContextType {
  userData: UserData;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userData: {
    id: null,
    email: null,
    avatar_url: null,
    isAdmin: false,
    display_name: null,
  },
  isLoading: true,
  refreshUserData: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData>({
    id: null,
    email: null,
    avatar_url: null,
    isAdmin: false,
    display_name: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        setIsLoading(false);
        return;
      }

      if (user) {
        try {
          const [profileResponse, isAdmin] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id).single(),
            PremiumManagementService.isUserAdmin(user.id),
          ]);

          if (profileResponse.error) {
            console.error("Profile fetch error:", profileResponse.error);
            // Set basic user data even if profile fetch fails
            setUserData({
              id: user.id,
              email: user.email || null,
              avatar_url: null,
              display_name: null,
              isAdmin: false,
            });
          } else {
            setUserData({
              id: user.id,
              email: user.email || null,
              avatar_url: profileResponse.data?.avatar_url || null,
              display_name: profileResponse.data?.display_name || null,
              isAdmin,
            });
          }
        } catch (error) {
          console.error("Error in profile/admin check:", error);
          // Set basic user data on error
          setUserData({
            id: user.id,
            email: user.email || null,
            avatar_url: null,
            display_name: null,
            isAdmin: false,
          });
        }
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
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
