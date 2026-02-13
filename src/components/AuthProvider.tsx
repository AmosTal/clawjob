"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profileCreated = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // On first sign-in, create user profile (fire-and-forget)
      if (firebaseUser && !profileCreated.current) {
        profileCreated.current = true;
        firebaseUser.getIdToken().then((token) => {
          fetch("/api/user", {
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
          }).catch(() => {
            // fire-and-forget: silently ignore errors
          });
        });
      }
    });

    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    profileCreated.current = false;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
