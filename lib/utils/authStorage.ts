import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "@auth_persist";

export const authStorage = {
  async setPersist(persist: boolean) {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(persist));
    } catch (error) {
      console.error("Error saving auth state:", error);
    }
  },

  async getPersist(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTH_KEY);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error("Error getting auth state:", error);
      return false;
    }
  },

  async clear() {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Error clearing auth state:", error);
    }
  },
};
