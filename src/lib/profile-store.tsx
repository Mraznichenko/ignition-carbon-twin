import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CarbonProfile } from "./carbon/types";

const KEY = "carbon-twin-profile";

interface Ctx {
  profile: CarbonProfile | null;
  setProfile: (p: CarbonProfile | null) => void;
}

const ProfileContext = createContext<Ctx>({ profile: null, setProfile: () => {} });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<CarbonProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfileState(JSON.parse(raw));
    } catch {
      localStorage.removeItem(KEY);
    }
  }, []);

  const setProfile = (p: CarbonProfile | null) => {
    setProfileState(p);
    try {
      if (p) localStorage.setItem(KEY, JSON.stringify(p));
      else localStorage.removeItem(KEY);
    } catch {
      // Persistence is best-effort; the in-memory profile still works.
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
