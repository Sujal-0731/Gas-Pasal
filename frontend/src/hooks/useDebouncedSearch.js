import { useState, useEffect, useRef, useCallback } from 'react';

function useDebouncedSearch(searchFn, options = {}) {
  const {
    delay = 800,
    minChars = 2,
    clearOnEmpty = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cancel any ongoing search
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Perform the actual search
  const performSearch = useCallback(async (term) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsSearching(true);
    setError(null);
    
    try {
      const data = await searchFn(term, abortControllerRef.current.signal);
      setResults(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchFn]);

  // Debounce effect
  useEffect(() => {
    // Clear timeout on every keystroke
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check minimum characters
    if (searchTerm.length >= minChars) {
      timeoutRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, delay);
    } else if (clearOnEmpty && searchTerm.length === 0) {
      setResults([]);
      setError(null);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, delay, minChars, clearOnEmpty, performSearch]);

  // Clear search completely
  const clearSearch = useCallback(() => {
    cancelSearch();
    setSearchTerm('');
    setResults([]);
    setError(null);
  }, [cancelSearch]);

  // Reset search (clear results but keep term)
  const resetResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    // State
    searchTerm,
    setSearchTerm,
    results,
    setResults,
    isSearching,
    error,
    // Actions
    clearSearch,
    resetResults,
    cancelSearch
  };
}

export default useDebouncedSearch;