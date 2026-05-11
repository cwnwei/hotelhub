import express from "express";
import Reservation from "../models/Reservation"
import Room from "../models/Room"
import User from "../models/User"
import { authorizeRoles } from "../middleware/rbac"
import jwt from "jsonwebtoken"
import { ReservationAdapter } from "../adapters/ReservationAdapter";

const reservationrouter = express.Router();

reservationrouter.get("/", authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ createdAt: -1 });
        const formattedreservations = await Promise.all(
            reservations.map(r => ReservationAdapter.enrichBasic(r))
        );

        res.status(200).json(formattedreservations);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
})

reservationrouter.get("/my-reservations", authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const jwtToken = req.cookies.jwtToken;
        if (!jwtToken) {
            return res.status(401).json({ message: 'Missing JWT Token' });
        }

        const decoded = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET!) as any;
        const userId = decoded.userId;

        const reservations = await Reservation.find({ guest_id: userId })
            .sort({ check_in_date: -1 });

        const formattedReservations = await ReservationAdapter.enrichAll(reservations);

        res.status(200).json(formattedReservations);

    } catch (err: any) {
        console.error(err);

        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid JWT token" });
        }

        res.status(500).json({ message: "Server error" });
    }
})

reservationrouter.post("/", authorizeRoles('admin', 'user'), async (req, res) => {
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

reservationrouter.put("/:id", authorizeRoles('admin', 'user'), async (req, res) => {
    try {
        const { id } = req.params;
        const { guest_id, room_id } = req.body

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

reservationrouter.delete("/:id", authorizeRoles('admin', 'user'), async (req, res) => {
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