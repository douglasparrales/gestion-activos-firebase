import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const saveLog = async (userName: string, action: string) => {
  try {
    await addDoc(collection(db, "logs"), {
      userName,
      action,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.log("Error guardando log:", error);
  }
};
