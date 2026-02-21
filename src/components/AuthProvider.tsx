"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  getRedirectResult,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: UserProfile["role"] | undefined;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: undefined,
  userProfile: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const profileCreated = useRef(false);
  const profileCreating = useRef(false);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile: UserProfile = await res.json();
        setUserProfile(profile);
      }
    } catch {
      // Silently ignore — profile fetch is best-effort
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // Resolve any pending redirect sign-in (e.g. Google on mobile)
    getRedirectResult(auth).catch(() => {
      // Redirect errors (e.g. account-exists-with-different-credential) are
      // non-critical here — onAuthStateChanged handles the happy path.
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // On first sign-in, create user profile then fetch it.
        // Guard with both a "created" flag and a "creating" mutex to
        // prevent duplicate profile creation on rapid auth-state changes.
        if (!profileCreated.current && !profileCreating.current) {
          profileCreating.current = true;
          try {
            const token = await firebaseUser.getIdToken();
            await fetch("/api/user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              }),
            });
            profileCreated.current = true;
          } catch {
            // fire-and-forget: silently ignore errors
          } finally {
            profileCreating.current = false;
          }
        }
        await fetchProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    profileCreated.current = false;
    profileCreating.current = false;
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: userProfile?.role,
        userProfile,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
