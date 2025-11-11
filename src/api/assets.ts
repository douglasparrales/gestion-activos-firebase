import { db } from "../services/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { Asset } from "../types/Asset";

const activosRef = collection(db, "activos");

// 🔹 Función para generar un ID incremental automáticamente
export async function generateNextAssetId(): Promise<string> {
  try {
    const q = query(activosRef, orderBy("id", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return "1"; // primer activo
    }

    const lastAsset = snapshot.docs[0].data() as Asset;
    const lastId = parseInt(lastAsset.id, 10);

    if (isNaN(lastId)) {
      console.warn("⚠️ El último ID no es numérico. Se usará 1.");
      return "1";
    }

    return String(lastId + 1);
  } catch (error) {
    console.error("❌ Error generando ID automático:", error);
    return Date.now().toString(); // fallback de emergencia
  }
}

// 🔹 Guardar activo (con ID autogenerado si no tiene)
export const addAsset = async (asset: Asset) => {
  try {
    let assetId = asset.id;

    if (!assetId) {
      assetId = await generateNextAssetId();
      asset.id = assetId;
    }

    const docRef = doc(db, "activos", assetId);
    await setDoc(docRef, asset, { merge: true });

    console.log("✅ Activo guardado en Firestore:", asset.id);
    return assetId;
  } catch (error) {
    console.error("❌ Error en addAsset:", error);
    throw error;
  }
};

// 🔹 Obtener un activo
export async function getAsset(id: string): Promise<Asset | null> {
  const ref = doc(collection(db, "activos"), id);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Asset) : null;
}
