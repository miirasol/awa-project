import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { LIMITS } from "@/lib/limits";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef(null);
  const creatingRef = useRef(new Set());
  const registeringRef = useRef(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const ref = doc(db, "users", u.uid);
      profileUnsubRef.current = onSnapshot(
        ref,
        async (snap) => {
          if (snap.exists()) {
            setProfile(snap.data());
            setLoading(false);
            return;
          }
          // register() writes the full profile itself; don't race it with a blank fallback doc
          if (registeringRef.current) return;
          if (!creatingRef.current.has(u.uid)) {
            creatingRef.current.add(u.uid);
            try {
              await setDoc(
                ref,
                {
                  email: u.email || "",
                  role: "patient",
                  fullName: (u.displayName || "").slice(0, LIMITS.personName),
                  phone: "",
                  createdAt: serverTimestamp(),
                },
                { merge: true },
              );
            } catch (err) {
              console.error(err);
              creatingRef.current.delete(u.uid);
              await signOut(auth);
            }
            creatingRef.current.delete(u.uid);
          }
        },
        (err) => {
          console.error(err);
          signOut(auth);
        },
      );
    });
    return () => {
      unsubAuth();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  const login = async (email, password, remember) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, fullName, phone) => {
    registeringRef.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          email,
          role: "patient",
          fullName,
          phone,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        // Profile write failed: remove the auth account so we never keep a login with no/blank profile
        try {
          await deleteUser(cred.user);
        } catch (e) {
          console.error(e);
          await signOut(auth);
        }
        throw err;
      }
      return cred;
    } finally {
      registeringRef.current = false;
    }
  };

  const googleSignIn = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          email: cred.user.email || "",
          role: "patient",
          fullName: (cred.user.displayName || "").slice(0, LIMITS.personName),
          phone: "",
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
    return cred;
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        loading,
        login,
        register,
        googleSignIn,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
