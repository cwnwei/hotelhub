import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { hotelClient } from "@/api/hotelClient";

const HotelContext = createContext(null);

export function HotelProvider({ children }) {
    const [selectedHotelId, setSelectedHotelId] = useState(null);

    const { data: hotelsData = [], isLoading } = useQuery({
        queryKey: ["hotels"],
        queryFn: hotelClient.list,
        // TODO: remove when backend integrate
        // Don't throw errors if backend fails
        retry: false,
        // Optional: short stale time to avoid repeated fetches during dev
        staleTime: 1000 * 60,
    });

    const hotels = hotelsData?.length > 0 ? hotelsData : [];

    useEffect(() => {
        if (hotels.length > 0 && !selectedHotelId) {
            setSelectedHotelId(hotels[0].id);
        }
    }, [hotels, selectedHotelId]);

    const selectedHotel = hotels.find(h => h.id === selectedHotelId) || null;

    return (
        <HotelContext.Provider
            value={{
                hotels,
                selectedHotel,
                selectedHotelId,
                setSelectedHotelId,
                isLoading: isLoading && !hotelsData?.length, // consider loading only if real fetch is pending,
            }}
        >
            {children}
        </HotelContext.Provider>
    );
}

export function useHotel() {
    const context = useContext(HotelContext);
    if (!context) {
        throw new Error("useHotel must be used within HotelProvider");
    }
    return context;
}