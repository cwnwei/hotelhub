const API_URL = import.meta.env.VITE_API_URL;

async function refreshToken() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }
}

export async function fetchWithAuth(url, options = {}, retry = true) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // If JWT expired → try refresh once
  if (response.status === 401 && retry) {
    try {
      await refreshToken();
      return fetchWithAuth(url, options, false); // retry once
    } catch (err) {
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
}