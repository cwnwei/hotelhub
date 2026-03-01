import express from "express";
import Reservation from "../models/Reservation"
import Room from "../models/Room"
import User from "../models/User"
import { authorizeRoles } from "../middleware/rbac"

const reservationrouter = express.Router();

reservationrouter.get("/", authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ createdAt: -1 });
        const formattedreservations = reservations.map(reservation => ({
            ...reservation.toObject(),
            id: reservation._id,
        }));

        res.status(200).json(formattedreservations);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})

reservationrouter.post("/", authorizeRoles('admin'), async (req, res) => {
    const {guest_id, room_id } = req.body

    const room = await Room.findById(room_id)
    if (!room) return res.status(400).json("Room does not exist")

    const user = await User.findById(guest_id)
    if (!user) return res.status(400).json("Guest does not exist")

    const new_reservation = await Reservation.create(req.body)

    res.status(200).json({
        "id": new_reservation.id,
        ...new_reservation.toJSON()
    })
})

reservationrouter.put("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const {guest_id, room_id } = req.body

        const room = await Room.findById(room_id)
        if (!room) return res.status(400).json("Room does not exist")

        const user = await User.findById(guest_id)
        if (!user) return res.status(400).json("Guest does not exist")

        const updatedreservation = await Reservation.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,            // return updated document
                runValidators: true,  // enforce schema validation
            }
        );

        if (!updatedreservation) {
            return res.status(404).json({ message: "reservation not found" });
        }

        res.status(200).json({
            "id": updatedreservation.id,
            ...updatedreservation.toJSON()
        })

    } catch (err: any) {
        console.error(err);

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error" });
    }
})

reservationrouter.delete("/:id", authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const deletedreservation = await Reservation.findByIdAndDelete(id);

        if (!deletedreservation) {
            return res.status(404).json({ message: "reservation not found" });
        }

        res.status(200).json({
            "id": deletedreservation.id,
            ...deletedreservation.toJSON()
        });

    } catch (err: any) {
        console.error(err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid reservation ID" });
        }

        res.status(500).json({ message: "Server error" });
    }
})

export default reservationrouter