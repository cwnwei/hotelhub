const API_URL = import.meta.env.VITE_API_URL;

export const guestClient = {
  async list() {
    const response = await fetch(`${API_URL}/guests`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch guests");
    }
    
    return response.json();
  },

  async create(data) {
    const response = await fetch(`${API_URL}/guests`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create guest");
    }
    
    return response.json();
  },

  async update(id, data) {
    const response = await fetch(`${API_URL}/guests/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update guest");
    }
    
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`${API_URL}/guests/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete guest");
    }
    
    return response.json();
  },
};
