const API_URL = import.meta.env.VITE_API_URL;
import { fetchWithAuth } from "@/api/auth";

export const analyticsClient = {
    async getRevenueReport(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetchWithAuth(`${API_URL}/analytics/revenue?${params}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch revenue report");
        }

        return response.json();
    },

    async getOccupancyReport(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetchWithAuth(`${API_URL}/analytics/occupancy?${params}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch occupancy report");
        }

        return response.json();
    },

    async getBookingTrends(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetchWithAuth(`${API_URL}/analytics/trends?${params}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch booking trends");
        }

        return response.json();
    },

    exportToCSV(filters = {}) {
        const params = new URLSearchParams(filters);
        window.location.href = `${API_URL}/analytics/export/csv?${params}`;
    },

    exportToPDF(filters = {}) {
        const params = new URLSearchParams(filters);
        window.location.href = `${API_URL}/analytics/export/pdf?${params}`;
    }
};