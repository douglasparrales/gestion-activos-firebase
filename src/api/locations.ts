import { db } from "../services/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export interface Location {
  id: string;
  name: string;
}

const COLLECTION = "locations";

export const getLocations = async (): Promise<Location[]> => {
  const q = query(collection(db, COLLECTION), orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));
};

export const addLocation = async (name: string) => {
  await addDoc(collection(db, COLLECTION), {
    name,
    createdAt: Timestamp.now(),
  });
};
