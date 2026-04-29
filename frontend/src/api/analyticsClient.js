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

    async exportToCSV(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetchWithAuth(`${API_URL}/analytics/export/csv?${params}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Failed to export CSV");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservations-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    async exportToPDF(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetchWithAuth(`${API_URL}/analytics/export/pdf?${params}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Failed to export PDF");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservations-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};