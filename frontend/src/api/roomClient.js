const API_URL = import.meta.env.VITE_API_URL;
import { fetchWithAuth } from "@/api/auth"

export const roomClient = {
  async list() {
    const response = await fetchWithAuth(`${API_URL}/rooms`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch rooms");
    }

    return response.json();
  },

  async search({ checkIn, checkOut, guests, roomType }) {
    const params = new URLSearchParams({
      check_in_date: checkIn,
      check_out_date: checkOut,
      num_guests: guests.toString()
    });

    if (roomType && roomType !== "all") {
      params.set("room_type", roomType);
    }

    const response = await fetch(`${API_URL}/rooms/search?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to search rooms");
    }

    const data = await response.json();

    // Transform response to match list() format for consistency
    return data.rooms.map(room => ({
      ...room,
      hotel_name: room.hotel?.name,
      hotel_id: room.hotel?.id
    }));
  },

  async create(data) {
    const response = await fetchWithAuth(`${API_URL}/rooms`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create room");
    }

    return response.json();
  },

  async update(id, data) {
    const response = await fetchWithAuth(`${API_URL}/rooms/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update room");
    }

    return response.json();
  },

  async delete(id) {
    const response = await fetchWithAuth(`${API_URL}/rooms/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete room");
    }

    return response.json();
  },
};
