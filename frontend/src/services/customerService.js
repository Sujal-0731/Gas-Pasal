const API_URL = import.meta.env.VITE_API_URL;

/**
 * Search customers by name or phone
 */
export const searchCustomers = async (searchTerm, signal) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  
  const response = await fetch(`${API_URL}/customers?search=${encodeURIComponent(searchTerm)}`, {
    credentials: 'include',
    signal
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Search failed');
  }
  
  return data.data || [];
};

/**
 * Get all customers (for list views)
 */
export const getAllCustomers = async () => {
  const response = await fetch(`${API_URL}/customers`, {
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch customers');
  }
  
  return data.data || [];
};