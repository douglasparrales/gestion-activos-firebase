export type RootStackParamList = {
  AssetList: undefined;
  AddAsset: { assetId?: number } | undefined;
  ScanAsset: undefined;
  AssetDetail: { assetId: number };

  // Pantalla nueva (Home principal del nuevo diseño)
  ActivosHome: undefined;

  // Tu screen anidado (si lo quieres mantener)
  Activos: {
    screen: "AddAsset" | "AssetList" | "AssetDetail";
    params?: any;
  };

  // ✅ AGREGADO: Define la ruta 'Tabs' con sus sub-screens
  Tabs: {
    screen: "Inicio" | "Lista" | "Escanear" | "Agregar";
    params?: any; // Usamos 'any' para evitar romper la complejidad de tipos si no tienes 'params' específicos aquí.
  };
};