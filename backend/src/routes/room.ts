import express from "express";
import Room from "../models/Room";
import Hotel from "../models/Hotel";
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