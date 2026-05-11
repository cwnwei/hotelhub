import Room from "../models/Room";
import Hotel from "../models/Hotel";

export class ReservationAdapter {
    static async enrich(reservation: any) {
        const room = await Room.findById(reservation.room_id);
        let hotel = null;
        if (room) {
            hotel = await Hotel.findById(room.hotel_id);
        }
        return {
            ...reservation.toObject(),
            id: reservation._id,
            room: room ? {
                id: room._id,
                room_number: room.room_number,
                room_type: room.room_type,
                max_guests: room.max_guests,
                price_per_night: room.price_per_night,
                image_url: room.image_url || null
            } : null,
            hotel: hotel ? {
                id: hotel._id,
                name: hotel.name,
                address: hotel.address,
                city: hotel.city,
                country: hotel.country,
                phone: hotel.phone,
                email: hotel.email,
                image_url: hotel.image_url || null
            } : null
        };
    }

    static async enrichAll(reservations: any[]) {
        return Promise.all(reservations.map(r => ReservationAdapter.enrich(r)));
    }

    static async enrichBasic(reservation: any) {
        const room = await Room.findById(reservation.room_id);
        return {
            ...reservation.toObject(),
            id: reservation._id,
            hotel_id: room?.hotel_id
        };
    }
}
