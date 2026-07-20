import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  coupleId: string | null;
  inviteCode: string | null;
  isLoading: boolean;
  setAuth: (
    token: string,
    user: User,
    coupleId: string,
    inviteCode?: string,
  ) => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  coupleId: null,
  inviteCode: null,
  isLoading: true,

  setAuth: async (token, user, coupleId, inviteCode) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    await AsyncStorage.setItem("coupleId", coupleId);
    if (inviteCode) await AsyncStorage.setItem("inviteCode", inviteCode);
    set({ token, user, coupleId, inviteCode: inviteCode || null });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("coupleId");
    await AsyncStorage.removeItem("inviteCode");
    set({ token: null, user: null, coupleId: null, inviteCode: null });
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");
      const coupleId = await AsyncStorage.getItem("coupleId");
      const inviteCode = await AsyncStorage.getItem("inviteCode");
      if (token && user && coupleId) {
        set({
          token,
          user: JSON.parse(user),
          coupleId,
          inviteCode,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
