import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'traveler'
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch role data from a dedicated users collection
        const userDoc = await getDoc(doc(db, 'Users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'traveler');
        } else {
          setUserRole('traveler');
        }
      } else {
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, login, logout }}>
      {!authLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);