const API_URL = import.meta.env.VITE_API_URL;

export const roomClient = {
  async list() {
    const response = await fetch(`${API_URL}/rooms`, {
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

  async create(data) {
    const response = await fetch(`${API_URL}/rooms`, {
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
    const response = await fetch(`${API_URL}/rooms/${id}`, {
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
    const response = await fetch(`${API_URL}/rooms/${id}`, {
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
