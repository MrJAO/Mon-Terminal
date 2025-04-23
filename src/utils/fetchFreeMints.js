// utils/fetchFreeMints.js

export async function fetchFreeMints(limit = 10) {
    try {
      const res = await fetch(`/api/free-mints?limit=${limit}`)
      const json = await res.json()
  
      if (json.success && Array.isArray(json.data)) {
        return json.data
      } else {
        console.warn('⚠️ Backend returned error or unexpected format:', json.error || 'Invalid data structure')
        return []
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch free mints from backend:', err.message)
      return []
    }
  }
  