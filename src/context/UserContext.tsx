import React, { createContext, useContext, useState } from "react";

type Role = "admin" | "normal";

type UserContextType = {
  role: Role;
  setRole: (r: Role) => void;
};

const UserContext = createContext<UserContextType>({
  role: "normal",
  setRole: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role>("admin"); // ← Cambia a "normal" cuando quieras

  return (
    <UserContext.Provider value={{ role, setRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
