import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Definimos la interfaz para mantener el tipado de TypeScript
interface User {
  uid: string;
  email: string | null;
  name: string;
  role: string;
}

// Definimos lo que el contexto va a exponer
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loadingUser: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Escucha cambios en el estado de autenticación (Login/Logout/Persistencia)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Si hay un usuario, buscamos su rol y nombre en Firestore
          const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name,
              role: userData.role,
            });
          } else {
            // Caso borde: está en Auth pero no en la base de datos de usuarios
            setUser(null);
          }
        } else {
          // No hay sesión activa
          setUser(null);
        }
      } catch (error) {
        console.error("Error al recuperar perfil del usuario:", error);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    });

    // Limpia la suscripción al desmontar el componente
    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de un UserProvider");
  }
  return context;
};