const API_URL = import.meta.env.VITE_API_URL;
import { fetchWithAuth } from "@/api/auth"

export const reservationClient = {
  async list() {
    const response = await fetchWithAuth(`${API_URL}/reservations`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch reservations");
    }

    return response.json();
  },

  async create(data) {
    const response = await fetchWithAuth(`${API_URL}/reservations`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create reservation");
    }

    return response.json();
  },

  async update(id, data) {
    const response = await fetchWithAuth(`${API_URL}/reservations/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update reservation");
    }

    return response.json();
  },

  async delete(id) {
    const response = await fetchWithAuth(`${API_URL}/reservations/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete reservation");
    }

    return response.json();
  },
};
