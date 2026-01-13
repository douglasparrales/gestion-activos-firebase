import { useState, useEffect, useRef, useCallback } from "react";
import { Animated } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { addAsset, getAsset, getAllAssets } from "../api/assets";
import { getCategories } from "../api/categories";
import { getLocations } from "../api/locations";
import { useUser } from "../context/UserContext";
import { Asset } from "../types/Asset";

export const STATES = ["Activo", "En mantenimiento", "Baja"];

export const initialState: Asset = {
  id: 0, nombre: "", categoria: "", estado: "", ubicacion: "", descripcion: "", observacion: "",
  fechaAdquisicion: new Date().toISOString().split("T")[0], fechaRegistro: new Date().toISOString(),
  costoInicial: undefined, depreciacionAnual: undefined, 
  cantidad: 1,
};

export const useAddAsset = () => {
  const route = useRoute<any>(), navigation = useNavigation<any>(), { assetId } = route.params || {};
  const { user } = useUser();
  
  const [asset, setAsset] = useState<Asset>(initialState);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [pick, setPick] = useState({ visible: false, title: "", data: [] as string[], field: "" });
  const [showDP, setShowDP] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isEditing = Boolean(assetId);
  const canEditAdminFields = user?.role === "admin" || !isEditing;

  const validate = (f: keyof Asset, v: any) => {
    let m = ""; const val = String(v ?? "").trim();
    if (["nombre", "categoria", "estado", "ubicacion", "costoInicial", "cantidad"].includes(f) && !val) {
      m = "Obligatorio";
    } else if (f === "nombre" && !/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(val)) {
      m = "Solo letras";
    } else if (f === "costoInicial" && (isNaN(Number(val)) || Number(val) <= 0)) {
      m = "Debe ser > 0";
    } else if (f === "cantidad" && (isNaN(Number(val)) || Number(val) <= 0)) {
      m = "Debe ser mayor a 0";
    } else if (f === "depreciacionAnual" && val !== "" && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 100)) {
      m = "0 a 100%";
    }
    setErrors(p => ({ ...p, [f]: m })); return !m;
  };

  const handleChange = (f: keyof Asset, v: any) => {
    let val = ["costoInicial", "depreciacionAnual", "cantidad"].includes(f) 
      ? String(v).replace(/[^0-9.]/g, "") 
      : v;
    if (typeof v === "string" && f === "nombre") {
      val = v.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    setAsset(p => ({ ...p, [f]: val })); validate(f, val);
  };

  useEffect(() => {
    getCategories().then(data => setCategories(data.map((c: any) => c.name)));
    getLocations().then(data => setLocations(data.map((l: any) => l.name)));
    getAllAssets().then(all => setTotalAssets(all.length));
    
    if (assetId) { 
      setLoading(true); 
      getAsset(assetId)
        .then(ex => { if(ex) setAsset({ ...ex, cantidad: ex.cantidad ?? 1 }); })
        .finally(() => setLoading(false)); 
    }
  }, [assetId]);

  useFocusEffect(
    useCallback(() => {
      if (assetId) return;
      setAsset(initialState);
      setErrors({});
    }, [assetId])
  );

  const handleSave = async () => {
    const fields: (keyof Asset)[] = ["nombre", "categoria", "estado", "ubicacion", "costoInicial", "cantidad"];
    if (!fields.every(f => validate(f, asset[f]))) return;
    
    if (asset.depreciacionAnual && !validate("depreciacionAnual", asset.depreciacionAnual)) return;

    setLoading(true);
    try {
      const toSave = { 
        ...asset, 
        cantidad: Number(asset.cantidad) || 1,
        costoInicial: Number(asset.costoInicial), 
        depreciacionAnual: asset.depreciacionAnual ? Number(asset.depreciacionAnual) : 0 
      };
      
      await addAsset(toSave);
      
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }), 
        Animated.delay(1200), 
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => {
        if (isEditing) {
          navigation.navigate("AssetDetail", { assetId: assetId });
        } else {
          setAsset(initialState);
          setErrors({});
          getAllAssets().then(all => setTotalAssets(all.length));
        }
      });

    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  return {
    asset, setAsset, categories, locations, errors, loading, totalAssets,
    pick, setPick, showDP, setShowDP, fadeAnim, isEditing, canEditAdminFields,
    handleChange, handleSave, navigation, assetId
  };
};