import React, { createContext, useContext, useState } from "react";

export type SubCategory = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: SubCategory[];
};

export type Asset = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  purchaseDate: string;
};

type AssetContextType = {
  assets: Asset[];
  categories: Category[];
  addAsset: (asset: Asset) => void;
  addCategory: (cat: Category) => void;
};

const AssetContext = createContext<AssetContextType>({
  assets: [],
  categories: [],
  addAsset: () => {},
  addCategory: () => {},
});

export const AssetProvider = ({ children }: { children: React.ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "Equipos",
      icon: "computer",
      color: "#1E88E5",
      subcategories: [
        { id: "1-1", name: "Laptop" },
        { id: "1-2", name: "PC Escritorio" },
        { id: "1-3", name: "Monitor" },
      ],
    },
    {
      id: "2",
      name: "Mobiliario",
      icon: "chair",
      color: "#43A047",
      subcategories: [
        { id: "2-1", name: "Silla" },
        { id: "2-2", name: "Escritorio" },
      ],
    },
  ]);

  const addAsset = (asset: Asset) => {
    setAssets((prev) => [...prev, asset]);
  };

  const addCategory = (cat: Category) => {
    setCategories((prev) => [...prev, cat]);
  };

  return (
    <AssetContext.Provider
      value={{ assets, categories, addAsset, addCategory }}
    >
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => useContext(AssetContext);
