// Merkezi Son Aramalar Yönetimi

const STORAGE_KEY = 'akuz_recent_searches';
const RECENT_SEARCHES_EVENT = 'akuz_recent_searches_updated';

export const getRecentSearches = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (term: string): string[] => {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();

  const current = getRecentSearches();
  const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, 10);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
  } catch (e) {
    console.error(e);
  }

  return updated;
};

export const removeRecentSearch = (termToRemove: string): string[] => {
  const current = getRecentSearches();
  const updated = current.filter((item) => item.toLowerCase() !== termToRemove.toLowerCase());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
  } catch (e) {
    console.error(e);
  }

  return updated;
};

export const clearAllRecentSearches = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
  } catch (e) {
    console.error(e);
  }
};

export const RECENT_SEARCH_EVENT_NAME = RECENT_SEARCHES_EVENT;
