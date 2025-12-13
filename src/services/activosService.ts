import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Asset } from "../types/Asset";

export const getAllAssets = async (): Promise<Asset[]> => {
  const snapshot = await getDocs(collection(db, "activos"));

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Asset, "id">;

    return {
      id: Number(doc.id), 
      ...data,
    };
  });
};
