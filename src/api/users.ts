// src/api/users.ts
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

// Obtener todos los usuarios
export const getUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "usuarios"));
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.log("Error getUsers:", error);
    return [];
  }
};

// Crear usuario/persona (sin cuenta)
export const createUserPlaceholder = async (name: string) => {
  try {
    const ref = doc(collection(db, "usuarios"));
    await setDoc(ref, {
      name,
      email: null,
      role: null,
      isAccount: false,
      createdAt: new Date()
    });
    return ref.id;
  } catch (error) {
    console.log("Error createUserPlaceholder:", error);
    return null;
  }
};

// Completar usuario cuando se crea la cuenta real
export const upgradeToRealUser = async (id: string, data: any) => {
  try {
    const ref = doc(db, "usuarios", id);
    await updateDoc(ref, {
      ...data,
      isAccount: true
    });
  } catch (error) {
    console.log("Error upgradeToRealUser:", error);
  }
};
