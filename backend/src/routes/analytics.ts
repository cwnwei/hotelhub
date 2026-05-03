import express from "express";
import mongoose from "mongoose";
import Reservation from "../models/Reservation";
import Room from "../models/Room";
import { authorizeRoles } from "../middleware/rbac";

const analyticsrouter = express.Router();

interface AnalyticsQuery {
    startDate?: string;
    endDate?: string;
    hotelId?: string;
}

const getObjectId = (id?: string) => {
    if (!id) return null;
    return mongoose.Types.ObjectId.isValid(id)
        ? new mongoose.Types.ObjectId(id)
        : null;
};

const buildDateFilter = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return {};

    const filter: any = {};
    filter.check_in_date = {};
    if (startDate) filter.check_in_date.$gte = startDate;
    if (endDate) filter.check_in_date.$lte = endDate;
    return filter;
};

const attachHotelFilter = async (filter: any, hotelId?: string) => {
    const hotelObjectId = getObjectId(hotelId);

    if (hotelId && !hotelObjectId) {
        throw new Error("Invalid hotelId");
    }

    if (hotelObjectId) {
        const roomIds = await Room.find({ hotel_id: hotelObjectId }).distinct("_id");
        filter.room_id = { $in: roomIds };
    }
};

analyticsrouter.get("/revenue", authorizeRoles("admin"), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query as AnalyticsQuery;
        const filter: any = buildDateFilter(startDate, endDate);
        await attachHotelFilter(filter, hotelId);

        const reservations = await Reservation.find(filter);

        const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const totalPaid = reservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
        const totalPending = totalRevenue - totalPaid;

        const revenueByStatus = reservations.reduce((acc: any, r) => {
            const status = r.payment_status || "unknown";
            acc[status] = (acc[status] || 0) + (r.total_amount || 0);
            return acc;
        }, {});

        const revenueByMonth = reservations.reduce((acc: any, r) => {
            if (r.check_in_date) {
                const month = r.check_in_date.substring(0, 7);
                acc[month] = (acc[month] || 0) + (r.total_amount || 0);
            }
            return acc;
        }, {});

        res.status(200).json({
            summary: {
                totalRevenue,
                totalPaid,
                totalPending,
                totalReservations: reservations.length
            },
            byStatus: revenueByStatus,
            byMonth: Object.entries(revenueByMonth)
                .map(([month, revenue]) => ({ month, revenue }))
                .sort((a, b) => a.month.localeCompare(b.month))
        });

    } catch (err: any) {
        if (err.message === "Invalid hotelId") {
            return res.status(400).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: "Server error while fetching revenue report" });
    }
});

analyticsrouter.get("/occupancy", authorizeRoles("admin"), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query as AnalyticsQuery;

        const filter: any = {};

        if (startDate || endDate) {
            filter.$or = [
                { check_in_date: { $gte: startDate, $lte: endDate } },
                { check_out_date: { $gte: startDate, $lte: endDate } }
            ];
        }
        await attachHotelFilter(filter, hotelId);

        const reservations = await Reservation.find(filter);

        let totalRooms = 0;
        const hotelObjectId = getObjectId(hotelId);
        if (hotelObjectId) {
            totalRooms = await Room.countDocuments({ hotel_id: hotelObjectId });
        } else {
            totalRooms = await Room.countDocuments();
        }

        const occupiedRoomIds = new Set(
            reservations
                .filter(r => r.status === "confirmed" || r.status === "checked_in")
                .map(r => r.room_id.toString())
        );

        const occupancyRate = totalRooms > 0
            ? (occupiedRoomIds.size / totalRooms) * 100
            : 0;

        const roomMatch = hotelObjectId ? { hotel_id: hotelObjectId } : {};

        const byRoomType = await Room.aggregate([
            { $match: roomMatch },
            {
                $group: {
                    _id: "$room_type",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            summary: {
                totalRooms,
                occupiedRooms: occupiedRoomIds.size,
                availableRooms: totalRooms - occupiedRoomIds.size,
                occupancyRate: Math.round(occupancyRate * 100) / 100
            },
            byRoomType
        });

    } catch (err: any) {
        if (err.message === "Invalid hotelId") {
            return res.status(400).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: "Server error while fetching occupancy report" });
    }
});

analyticsrouter.get("/trends", authorizeRoles("admin"), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query as AnalyticsQuery;

        const filter: any = buildDateFilter(startDate, endDate);
        await attachHotelFilter(filter, hotelId);

        const reservations = await Reservation.find(filter).sort({ check_in_date: 1 });

        const bookingsByMonth = reservations.reduce((acc: any, r) => {
            if (r.check_in_date) {
                const month = r.check_in_date.substring(0, 7);

                if (!acc[month]) {
                    acc[month] = {
                        month,
                        count: 0,
                        revenue: 0,
                        guests: 0
                    };
                }

                acc[month].count++;
                acc[month].revenue += r.total_amount || 0;
                acc[month].guests += r.num_guests || 0;
            }
            return acc;
        }, {});

        const trends = Object.values(bookingsByMonth).sort((a: any, b: any) =>
            a.month.localeCompare(b.month)
        );

        const statusBreakdown = reservations.reduce((acc: any, r) => {
            const status = r.status || "unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const averageStayLength = reservations.reduce((sum, r) => {
            if (r.check_in_date && r.check_out_date) {
                const days = Math.ceil(
                    (new Date(r.check_out_date).getTime() -
                        new Date(r.check_in_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return sum + days;
            }
            return sum;
        }, 0) / (reservations.length || 1);

        res.status(200).json({
            trends,
            summary: {
                totalBookings: reservations.length,
                averageStayLength: Math.round(averageStayLength * 100) / 100,
                statusBreakdown
            }
        });

    } catch (err: any) {
        if (err.message === "Invalid hotelId") {
            return res.status(400).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: "Server error while fetching booking trends" });
    }
});

analyticsrouter.get("/export/csv", authorizeRoles("admin"), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query as AnalyticsQuery;

        const filter: any = buildDateFilter(startDate, endDate);
        await attachHotelFilter(filter, hotelId);

        const reservations = await Reservation.find(filter);

        const csvHeader =
            "Guest Name,Room Number,Check-In,Check-Out,Guests,Status,Total Amount,Amount Paid,Payment Status\n";

        const csvRows = reservations.map(r =>
            `${r.guest_name || ""},${r.room_number || ""},${r.check_in_date || ""},${r.check_out_date || ""},${r.num_guests || 0},${r.status || ""},${r.total_amount || 0},${r.amount_paid || 0},${r.payment_status || ""}`
        ).join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=reservations-export.csv");
        res.status(200).send(csvHeader + csvRows);

    } catch (err: any) {
        if (err.message === "Invalid hotelId") {
            return res.status(400).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: "Server error while exporting CSV" });
    }
});

analyticsrouter.get("/export/pdf", authorizeRoles("admin"), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query as AnalyticsQuery;

        const filter: any = buildDateFilter(startDate, endDate);
        await attachHotelFilter(filter, hotelId);

        const reservations = await Reservation.find(filter);

        const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const totalPaid = reservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);

        const htmlReport = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Analytics Report</title></head>
<body>
<h1>HotelHub Analytics Report</h1>
<p>Total Reservations: ${reservations.length}</p>
<p>Total Revenue: $${totalRevenue.toFixed(2)}</p>
<p>Total Paid: $${totalPaid.toFixed(2)}</p>
</body>
</html>`;

        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Disposition", "attachment; filename=report.html");
        res.status(200).send(htmlReport);

    } catch (err: any) {
        if (err.message === "Invalid hotelId") {
            return res.status(400).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: "Server error while exporting PDF" });
    }
});

export default analyticsrouter;