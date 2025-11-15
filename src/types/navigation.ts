export type RootStackParamList = {
  AssetList: undefined;
  AddAsset: { assetId?: number } | undefined;
  ScanAsset: undefined;
  AssetDetail: { assetId: number };

  // 👇 AGREGAR ESTO
  Activos: {
    screen: "AddAsset" | "AssetList" | "AssetDetail";
    params?: any;
  };
};
