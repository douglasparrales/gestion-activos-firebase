import { db } from "../services/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export interface Category {
  id: string;
  name: string;
}

const COLLECTION = "categories";

export const getCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, COLLECTION), orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));
};

export const addCategory = async (name: string) => {
  await addDoc(collection(db, COLLECTION), {
    name,
    createdAt: Timestamp.now(),
  });
};
