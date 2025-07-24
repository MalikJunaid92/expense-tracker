import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser?.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "",
        });
        updateUserData(firebaseUser?.uid);
        router.replace("/(tabs)");
      } else {
        setUser(null);
        router.replace("/(auth)/welcome");
      }
    });
    return unsubscribe;
  }, []);
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, msg: "Login successful" };
    } catch (error: any) {
      let msg = error.message;
      console.log("Login error:", msg);
      if (msg.includes("(auth/user-not-found)")) {
        msg = "User not found";
      } else if (msg.includes("(auth/wrong-password)")) {
        msg = "Incorrect password";
      } else if (msg.includes("(auth/invalid-email)")) {
        msg = "Email format is invalid";
      }
      return { success: false, msg };
    }
  };
  const register = async (email: string, password: string, name: string) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        email,
        name,
        uid: response?.user?.uid,
      });
      return { success: true, msg: "Registration successful" };
    } catch (error: any) {
      let msg = error.message;
      console.log("Registration error:", msg);
       if (msg.includes("(auth/email-already-in-use)")) {
      msg = "Email is already registered";
    } else if (msg.includes("(auth/weak-password)")) {
      msg = "Password should be at least 6 characters";
    } else if (msg.includes("(auth/invalid-email)")) {
      msg = "Email format is invalid";
    }
      return { success: false, msg };
    }
  };
  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: data?.uid,
          email: data.email || "",
          name: data.name || "",
          image: data?.image || "",
        };
        setUser({ ...userData });
      }
    } catch (error: any) {
      let msg = error.message;
      //   return { success: false, msg };
      console.log(error, "error in updateUserData");
    }
  };
  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
