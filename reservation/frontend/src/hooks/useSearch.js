import { useState, useEffect } from 'react';

/** Owns the calendar search box: raw query, debounced value, and a busy flag. */
export function useSearch(delayMs = 250) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [searchQuery, delayMs]);

  return { searchQuery, setSearchQuery, debouncedSearch, isSearching };
}
