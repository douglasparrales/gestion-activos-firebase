// src/context/UserContext.tsx
import React, { createContext, useContext, useState } from "react";

interface User {
  uid: string;
  email: string | null;
  name: string;
  role: string;
}

const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
