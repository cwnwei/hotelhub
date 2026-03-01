import express from "express";
import Room from "../models/Room"
import { authorizeRoles } from "../middleware/rbac"

const roomrouter = express.Router();

roomrouter.get("/", authorizeRoles('admin', 'user'), async (req, res) => {
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
})

roomrouter.post("/", authorizeRoles('admin'), async (req, res) => {
    const { room_number, room_type, floor, price_per_night, status, max_guests, amenities, image_url } = req.body

    const room = await Room.findOne({ room_number })
    if (room) return res.status(400).json("User already exists")

    const new_room = await Room.create({
        room_number,
        room_type,
        floor,
        price_per_night,
        status,
        max_guests,
        amenities,
        image_url
    })

    res.status(200).json({
        "id": new_room.id,
        ...new_room.toJSON()
    })
})

roomrouter.put("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,            // return updated document
                runValidators: true,  // enforce schema validation
            }
        );

        if (!updatedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({
            "id": updatedRoom.id,
            ...updatedRoom.toJSON()
        })

    } catch (err: any) {
        console.error(err);

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error" });
    }
})

roomrouter.delete("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRoom = await Room.findByIdAndDelete(id);

        if (!deletedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({
            "id": deletedRoom.id,
            ...deletedRoom.toJSON()
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid room ID" });
        }

        res.status(500).json({ message: "Server error" });
    }
})

export default roomrouter