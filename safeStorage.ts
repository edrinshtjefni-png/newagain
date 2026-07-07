// Safe local storage wrapper preventing crashes in restricted iframe/sandbox environments
const memoryStore: Record<string, string> = {};

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem blocked/failed for key "${key}". Using in-memory fallback.`, e);
      return memoryStore[key] || null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem blocked/failed for key "${key}". Using in-memory fallback.`, e);
      memoryStore[key] = value;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem blocked/failed for key "${key}". Using in-memory fallback.`, e);
      delete memoryStore[key];
    }
  }
};
