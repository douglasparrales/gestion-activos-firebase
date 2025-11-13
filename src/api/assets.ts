import { db } from "../services/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";
import { Asset } from "../types/Asset";

const activosRef = collection(db, "activos");

/* =========================================================
    🔹 Generar ID incremental numérico
========================================================= */
export async function generateNextAssetId(): Promise<number> {
  try {
    const q = query(activosRef, orderBy("id", "desc"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return 1;

    const last = snap.docs[0].data() as Asset;

    const lastId = Number(last.id);

    return isNaN(lastId) ? 1 : lastId + 1;
  } catch (e) {
    console.error("❌ Error generando ID:", e);
    return Math.floor(Date.now());
  }
}

/* =========================================================
    🔹 Crear activo
========================================================= */
export async function addAsset(asset: Asset): Promise<number> {
  try {
    let newId = asset.id;

    if (!newId) {
      newId = await generateNextAssetId();
      asset.id = newId;
    }

    const ref = doc(db, "activos", String(newId));
    await setDoc(ref, asset, { merge: true });

    console.log("✅ Activo guardado:", newId);
    return newId;
  } catch (e) {
    console.error("❌ Error en addAsset:", e);
    throw e;
  }
}

/* =========================================================
    🔹 Obtener activo
========================================================= */
export async function getAsset(id: number | string): Promise<Asset | null> {
  try {
    const ref = doc(db, "activos", String(id));
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data() as Asset;

    return {
      ...data,
      id: Number(data.id),
    };
  } catch (e) {
    console.error("❌ Error en getAsset:", e);
    return null;
  }
}

/* =========================================================
    🔹 Obtener todos
========================================================= */
export async function getAllAssets(): Promise<Asset[]> {
  try {
    const snap = await getDocs(activosRef);

    return snap.docs.map((docSnap) => {
      const d = docSnap.data() as Asset;

      return {
        ...d,
        id: Number(d.id),
      };
    });
  } catch (e) {
    console.error("❌ Error obteniendo activos:", e);
    return [];
  }
}

/* =========================================================
    🔹 Actualizar
========================================================= */
export async function updateAsset(id: number, data: Partial<Asset>) {
  try {
    const ref = doc(db, "activos", String(id));
    await updateDoc(ref, data);
  } catch (e) {
    console.error("❌ Error en updateAsset:", e);
    throw e;
  }
}

/* =========================================================
    🔹 Eliminar
========================================================= */
export async function deleteAsset(id: number) {
  try {
    const ref = doc(db, "activos", String(id));
    await deleteDoc(ref);
  } catch (e) {
    console.error("❌ Error en deleteAsset:", e);
    throw e;
  }
}
