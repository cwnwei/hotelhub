import express from "express";
import Room from "../models/Room";
import Hotel from "../models/Hotel";
import Reservation from "../models/Reservation";
import { authorizeRoles } from "../middleware/rbac";

const roomrouter = express.Router();

roomrouter.get("/", authorizeRoles("admin", "user"), async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 });
        const formattedRooms = rooms.map(room => ({
            ...room.toObject(),
            id: room._id,
        }));

        res.status(200).json(formattedRooms);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Search available rooms with filters
roomrouter.get("/search", async (req, res) => {
    try {
        const {
            check_in_date,
            check_out_date,
            num_guests,
            room_type,
            hotel_name,
            min_price,
            max_price
        } = req.query;

        // Validate required parameters
        if (!check_in_date || !check_out_date || !num_guests) {
            return res.status(400).json({
                message: "check_in_date, check_out_date, and num_guests are required"
            });
        }

        // Parse num_guests to number
        const guestCount = parseInt(num_guests as string);
        if (isNaN(guestCount) || guestCount < 1) {
            return res.status(400).json({
                message: "num_guests must be a positive number"
            });
        }

        // Validate dates
        const checkInDate = new Date(check_in_date as string);
        const checkOutDate = new Date(check_out_date as string);

        if (isNaN(checkInDate.getTime())) {
            return res.status(400).json({
                message: "check_in_date is not a valid date"
            });
        }

        if (isNaN(checkOutDate.getTime())) {
            return res.status(400).json({
                message: "check_out_date is not a valid date"
            });
        }

        if (checkInDate >= checkOutDate) {
            return res.status(400).json({
                message: "check_out_date must be after check_in_date"
            });
        }

        // Optional: Check if check-in date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkInDate < today) {
            return res.status(400).json({
                message: "check_in_date cannot be in the past"
            });
        }

        // Build room query
        const roomQuery: any = {};

        // Filter by room type if provided
        if (room_type) {
            roomQuery.room_type = room_type;
        }

        // Filter by price range if provided
        if (min_price || max_price) {
            roomQuery.price_per_night = {};
            if (min_price) {
                const minPriceNum = parseFloat(min_price as string);
                if (!isNaN(minPriceNum)) {
                    roomQuery.price_per_night.$gte = minPriceNum;
                }
            }
            if (max_price) {
                const maxPriceNum = parseFloat(max_price as string);
                if (!isNaN(maxPriceNum)) {
                    roomQuery.price_per_night.$lte = maxPriceNum;
                }
            }
        }

        // Get all rooms matching the basic criteria
        let rooms = await Room.find(roomQuery).populate('hotel_id').lean();

        // Filter by hotel name if provided (partial match, case-insensitive)
        if (hotel_name) {
            rooms = rooms.filter(room => {
                const hotel = room.hotel_id as any;
                return hotel && hotel.name &&
                       hotel.name.toLowerCase().includes((hotel_name as string).toLowerCase());
            });
        }

        // Filter by max_guests capacity
        rooms = rooms.filter(room => {
            const maxGuests = parseInt(room.max_guests as string);
            return !isNaN(maxGuests) && maxGuests >= guestCount;
        });

        // Check availability - filter out rooms with overlapping reservations
        const availableRooms = [];
        for (const room of rooms) {
            // Find overlapping reservations for this room
            const overlappingReservations = await Reservation.find({
                room_id: String(room._id),
                check_in_date: { $lt: check_out_date as string },
                check_out_date: { $gt: check_in_date as string },
                status: { $ne: 'cancelled' }
            } as any);

            // If no overlapping reservations, room is available
            if (overlappingReservations.length === 0) {
                const hotel = room.hotel_id as any;
                availableRooms.push({
                    id: room._id,
                    room_number: room.room_number,
                    room_type: room.room_type,
                    floor: room.floor,
                    price_per_night: room.price_per_night,
                    status: room.status,
                    amenities: room.amenities,
                    max_guests: room.max_guests,
                    image_url: room.image_url,
                    hotel: {
                        id: hotel._id,
                        name: hotel.name,
                        address: hotel.address,
                        city: hotel.city,
                        country: hotel.country,
                        star_rating: hotel.star_rating,
                        image_url: hotel.image_url
                    }
                });
            }
        }

        res.status(200).json({
            total: availableRooms.length,
            check_in_date,
            check_out_date,
            num_guests: guestCount,
            filters: {
                room_type: room_type || null,
                hotel_name: hotel_name || null,
                min_price: min_price ? parseFloat(min_price as string) : null,
                max_price: max_price ? parseFloat(max_price as string) : null
            },
            rooms: availableRooms
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

roomrouter.post("/", authorizeRoles("admin"), async (req, res) => {
    try {
        const {
            room_number,
            room_type,
            floor,
            price_per_night,
            status,
            max_guests,
            amenities,
            image_url,
            hotel_id
        } = req.body;

        // Check if hotel exists
        const hotel = await Hotel.findById(hotel_id);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        // Check if room exists within the same hotel
        const existingRoom = await Room.findOne({ hotel_id, room_number });
        if (existingRoom) {
            return res.status(400).json({
                message: "Room number already exists for this hotel"
            });
        }

        const new_room = await Room.create({
            room_number,
            room_type,
            floor,
            price_per_night,
            status,
            max_guests,
            amenities,
            image_url,
            hotel_id
        });

        res.status(201).json({
            id: new_room.id,
            ...new_room.toJSON()
        });

    } catch (err: any) {
        console.error(err);

        // Mongo duplicate index protection
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Room number already exists for this hotel"
            });
        }

        res.status(500).json({ message: "Server error" });
    }
});

roomrouter.put("/:id", authorizeRoles("admin"), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // If updating hotel_id or room_number, check uniqueness
        if (updateData.hotel_id || updateData.room_number) {
            const room = await Room.findById(id);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }

            const hotel_id = updateData.hotel_id || room.hotel_id;
            const room_number = updateData.room_number || room.room_number;

            const duplicate = await Room.findOne({
                hotel_id,
                room_number,
                _id: { $ne: id }
            });

            if (duplicate) {
                return res.status(400).json({
                    message: "Room number already exists for this hotel"
                });
            }
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({
            id: updatedRoom.id,
            ...updatedRoom.toJSON()
        });

    } catch (err: any) {
        console.error(err);

        if (err.code === 11000) {
            return res.status(400).json({
                message: "Room number already exists for this hotel"
            });
        }

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error" });
    }
});

roomrouter.delete("/:id", authorizeRoles("admin"), async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRoom = await Room.findByIdAndDelete(id);

        if (!deletedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({
            id: deletedRoom.id,
            ...deletedRoom.toJSON()
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid room ID" });
        }

        res.status(500).json({ message: "Server error" });
    }
});

export default roomrouter;