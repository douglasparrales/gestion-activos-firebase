import { db } from "../services/firebaseConfig";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { Asset } from "../types/Asset"; // ✅ Importamos el tipo unificado

export const addAsset = async (asset: Asset) => {
  try {
    if (!asset.id) throw new Error("El activo no tiene ID.");
    const docRef = doc(db, "activos", asset.id);
    await setDoc(docRef, asset, { merge: true });
    console.log("✅ Activo guardado en Firestore:", asset.id);
  } catch (error) {
    console.error("❌ Error en addAsset:", error);
    throw error;
  }
};

// Función para obtener un activo
export async function getAsset(id: string): Promise<Asset | null> {
  const ref = doc(collection(db, "activos"), id);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Asset) : null;
}

