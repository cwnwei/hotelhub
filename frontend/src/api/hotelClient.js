const API_URL = import.meta.env.VITE_API_URL;
import { fetchWithAuth } from "@/api/auth";

export const hotelClient = {
  async list() {
    const response = await fetchWithAuth(`${API_URL}/hotels`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch hotels");
    }

    return response.json();
  },

  async create(data) {
    const response = await fetchWithAuth(`${API_URL}/hotels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create hotel");
    }

    return response.json();
  },

  async update(id, data) {
    const response = await fetchWithAuth(`${API_URL}/hotels/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update hotel");
    }

    return response.json();
  },

  async delete(id) {
    const response = await fetchWithAuth(`${API_URL}/hotels/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete hotel");
    }

    return response.json();
  },
};