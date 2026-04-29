import express from "express";
import Reservation from "../models/Reservation";
import Room from "../models/Room";
import { authorizeRoles } from "../middleware/rbac";

const analyticsrouter = express.Router();

analyticsrouter.get("/revenue", authorizeRoles('admin'), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query;

        const filter: any = {};

        if (startDate || endDate) {
            filter.check_in_date = {};
            if (startDate) filter.check_in_date.$gte = startDate;
            if (endDate) filter.check_in_date.$lte = endDate;
        }

        const reservations = await Reservation.find(filter);

        let filteredReservations = reservations;
        if (hotelId) {
            const roomIds = await Room.find({ hotel_id: hotelId }).distinct('_id');
            filteredReservations = reservations.filter(r =>
                roomIds.some(id => id.toString() === r.room_id)
            );
        }

        const totalRevenue = filteredReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const totalPaid = filteredReservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
        const totalPending = totalRevenue - totalPaid;

        const revenueByStatus = filteredReservations.reduce((acc: any, r) => {
            const status = r.payment_status || 'unknown';
            acc[status] = (acc[status] || 0) + (r.total_amount || 0);
            return acc;
        }, {});

        const revenueByMonth = filteredReservations.reduce((acc: any, r) => {
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
                totalReservations: filteredReservations.length
            },
            byStatus: revenueByStatus,
            byMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
                month,
                revenue
            })).sort((a, b) => a.month.localeCompare(b.month))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching revenue report" });
    }
});

analyticsrouter.get("/occupancy", authorizeRoles('admin'), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query;

        const filter: any = {};

        if (startDate || endDate) {
            filter.$or = [
                { check_in_date: { $gte: startDate, $lte: endDate } },
                { check_out_date: { $gte: startDate, $lte: endDate } }
            ];
        }

        const reservations = await Reservation.find(filter);

        let totalRooms = await Room.countDocuments();
        if (hotelId) {
            totalRooms = await Room.countDocuments({ hotel_id: hotelId });
            const roomIds = await Room.find({ hotel_id: hotelId }).distinct('_id');
            const filteredReservations = reservations.filter(r =>
                roomIds.some(id => id.toString() === r.room_id)
            );

            const occupiedRoomIds = new Set(
                filteredReservations
                    .filter(r => r.status === 'confirmed' || r.status === 'checked_in')
                    .map(r => r.room_id)
            );

            const occupancyRate = totalRooms > 0
                ? (occupiedRoomIds.size / totalRooms) * 100
                : 0;

            const byRoomType = await Room.aggregate([
                { $match: { hotel_id: hotelId } },
                { $group: {
                    _id: "$room_type",
                    count: { $sum: 1 }
                }}
            ]);

            return res.status(200).json({
                summary: {
                    totalRooms,
                    occupiedRooms: occupiedRoomIds.size,
                    availableRooms: totalRooms - occupiedRoomIds.size,
                    occupancyRate: Math.round(occupancyRate * 100) / 100
                },
                byRoomType
            });
        }

        const occupiedRoomIds = new Set(
            reservations
                .filter(r => r.status === 'confirmed' || r.status === 'checked_in')
                .map(r => r.room_id)
        );

        const occupancyRate = totalRooms > 0
            ? (occupiedRoomIds.size / totalRooms) * 100
            : 0;

        const byRoomType = await Room.aggregate([
            { $group: {
                _id: "$room_type",
                count: { $sum: 1 }
            }}
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

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching occupancy report" });
    }
});

analyticsrouter.get("/trends", authorizeRoles('admin'), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query;

        const filter: any = {};

        if (startDate || endDate) {
            filter.check_in_date = {};
            if (startDate) filter.check_in_date.$gte = startDate;
            if (endDate) filter.check_in_date.$lte = endDate;
        }

        const reservations = await Reservation.find(filter).sort({ check_in_date: 1 });

        let filteredReservations = reservations;
        if (hotelId) {
            const roomIds = await Room.find({ hotel_id: hotelId }).distinct('_id');
            filteredReservations = reservations.filter(r =>
                roomIds.some(id => id.toString() === r.room_id)
            );
        }

        const bookingsByMonth = filteredReservations.reduce((acc: any, r) => {
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

        const statusBreakdown = filteredReservations.reduce((acc: any, r) => {
            const status = r.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const averageStayLength = filteredReservations.reduce((sum, r) => {
            if (r.check_in_date && r.check_out_date) {
                const checkIn = new Date(r.check_in_date);
                const checkOut = new Date(r.check_out_date);
                const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
            }
            return sum;
        }, 0) / (filteredReservations.length || 1);

        res.status(200).json({
            trends,
            summary: {
                totalBookings: filteredReservations.length,
                averageStayLength: Math.round(averageStayLength * 100) / 100,
                statusBreakdown
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while fetching booking trends" });
    }
});

analyticsrouter.get("/export/csv", authorizeRoles('admin'), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query;

        const filter: any = {};

        if (startDate || endDate) {
            filter.check_in_date = {};
            if (startDate) filter.check_in_date.$gte = startDate;
            if (endDate) filter.check_in_date.$lte = endDate;
        }

        const reservations = await Reservation.find(filter);

        let filteredReservations = reservations;
        if (hotelId) {
            const roomIds = await Room.find({ hotel_id: hotelId }).distinct('_id');
            filteredReservations = reservations.filter(r =>
                roomIds.some(id => id.toString() === r.room_id)
            );
        }

        const csvHeader = 'Guest Name,Room Number,Check-In,Check-Out,Guests,Status,Total Amount,Amount Paid,Payment Status\n';
        const csvRows = filteredReservations.map(r =>
            `${r.guest_name || ''},${r.room_number || ''},${r.check_in_date || ''},${r.check_out_date || ''},${r.num_guests || 0},${r.status || ''},${r.total_amount || 0},${r.amount_paid || 0},${r.payment_status || ''}`
        ).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=reservations-export.csv');
        res.status(200).send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while exporting CSV" });
    }
});

analyticsrouter.get("/export/pdf", authorizeRoles('admin'), async (req, res) => {
    try {
        const { startDate, endDate, hotelId } = req.query;

        const filter: any = {};

        if (startDate || endDate) {
            filter.check_in_date = {};
            if (startDate) filter.check_in_date.$gte = startDate;
            if (endDate) filter.check_in_date.$lte = endDate;
        }

        const reservations = await Reservation.find(filter);

        let filteredReservations = reservations;
        if (hotelId) {
            const roomIds = await Room.find({ hotel_id: hotelId }).distinct('_id');
            filteredReservations = reservations.filter(r =>
                roomIds.some(id => id.toString() === r.room_id)
            );
        }

        const totalRevenue = filteredReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const totalPaid = filteredReservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);

        const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #4CAF50; color: white; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>HotelHub Analytics Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Report Period:</strong> ${startDate || 'All Time'} to ${endDate || 'Present'}</p>
        <p><strong>Total Reservations:</strong> ${filteredReservations.length}</p>
        <p><strong>Total Revenue:</strong> $${totalRevenue.toFixed(2)}</p>
        <p><strong>Total Paid:</strong> $${totalPaid.toFixed(2)}</p>
        <p><strong>Pending:</strong> $${(totalRevenue - totalPaid).toFixed(2)}</p>
    </div>
    <h2>Reservation Details</h2>
    <table>
        <thead>
            <tr>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Amount</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${filteredReservations.map(r => `
            <tr>
                <td>${r.guest_name || '-'}</td>
                <td>${r.room_number || '-'}</td>
                <td>${r.check_in_date || '-'}</td>
                <td>${r.check_out_date || '-'}</td>
                <td>$${(r.total_amount || 0).toFixed(2)}</td>
                <td>${r.status || '-'}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="footer">
        Generated on ${new Date().toISOString().split('T')[0]}
    </div>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'attachment; filename=reservations-report.html');
        res.status(200).send(htmlReport);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while exporting PDF" });
    }
});

export default analyticsrouter;
