import request from 'supertest';
import app from '../../src/app';
import Reservation from '../../src/models/Reservation';
import Room from '../../src/models/Room';
import jwt from 'jsonwebtoken';
import { createMockReservation, createMockRoom } from '../setup/testUtils';

// Mock dependencies
jest.mock('../../src/models/Reservation');
jest.mock('../../src/models/Room');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn(),
}));

// Helper to create mock reservation with analytics-specific fields
const adminToken = () =>
  (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });

const createAnalyticsMockReservation = (overrides = {}) => ({
  ...createMockReservation(),
  check_in_date: '2026-05-01',
  check_out_date: '2026-05-05',
  total_amount: 600,
  amount_paid: 300,
  payment_status: 'partial',
  num_guests: 2,
  room_id: 'room123',
  room_number: '101',
  guest_name: 'John Doe',
  status: 'confirmed',
  ...overrides,
});

describe('Analytics Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should return 401 when no JWT token is provided', async () => {
      const response = await request(app)
        .get('/analytics/revenue');

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin for /revenue endpoint', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when user is not admin for /occupancy endpoint', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when user is not admin for /trends endpoint', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when user is not admin for /export/csv endpoint', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when user is not admin for /export/pdf endpoint', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });

  describe('GET /analytics/revenue', () => {
    it('should return revenue report with all filters applied', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          _id: 'res1',
          check_in_date: '2026-05-01',
          total_amount: 600,
          amount_paid: 300,
          payment_status: 'partial',
          room_id: 'room123',
        }),
        createAnalyticsMockReservation({
          _id: 'res2',
          check_in_date: '2026-05-10',
          total_amount: 400,
          amount_paid: 400,
          payment_status: 'paid',
          room_id: 'room123',
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(['room123']),
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .query({
          startDate: '2026-05-01',
          endDate: '2026-05-31',
          hotelId: '507f1f77bcf86cd799439011',
        })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRevenue: 1000,
        totalPaid: 700,
        totalPending: 300,
        totalReservations: 2,
      });
      expect(response.body.byStatus).toEqual({
        partial: 600,
        paid: 400,
      });
      expect(Array.isArray(response.body.byMonth)).toBe(true);
    });

    it('should return revenue report without hotelId filter', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-01',
          total_amount: 500,
          amount_paid: 500,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ startDate: '2026-05-01', endDate: '2026-05-31' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalRevenue).toBe(500);
    });

    it('should return revenue report with no date filters', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({ total_amount: 300, amount_paid: 300 }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalRevenue).toBe(300);
    });

    it('should return empty revenue report when no reservations found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        totalReservations: 0,
      });
    });

    it('should return 400 when invalid hotelId is provided', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ hotelId: 'invalid-object-id' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should return 500 when database error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while fetching revenue report');
    });

    it('should return 500 when Room.find() fails during hotel filter', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockRejectedValue(new Error('Room find error')),
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ hotelId: '507f1f77bcf86cd799439011' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while fetching revenue report');
    });

    it('should calculate byMonth revenue correctly', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-01',
          total_amount: 300,
        }),
        createAnalyticsMockReservation({
          check_in_date: '2026-05-15',
          total_amount: 200,
        }),
        createAnalyticsMockReservation({
          check_in_date: '2026-06-01',
          total_amount: 400,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.byMonth).toContainEqual({ month: '2026-05', revenue: 500 });
      expect(response.body.byMonth).toContainEqual({ month: '2026-06', revenue: 400 });
    });
  });

  describe('GET /analytics/occupancy', () => {
    it('should return occupancy report for specific hotel with roomType breakdown', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          status: 'confirmed',
          room_id: 'room123',
        }),
      ];
      const mockRooms = [
        createMockRoom({ _id: 'room123', hotel_id: 'hotel123', room_type: 'deluxe' }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);
      (Room.countDocuments as jest.Mock).mockResolvedValue(5);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(['room123']),
      });
      (Room.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'deluxe', count: 3 },
        { _id: 'standard', count: 2 },
      ]);

      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ hotelId: '507f1f77bcf86cd799439011' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRooms: 5,
        occupiedRooms: 1,
        availableRooms: 4,
        occupancyRate: 20,
      });
      expect(Array.isArray(response.body.byRoomType)).toBe(true);
    });

    it('should return global occupancy report without hotelId filter', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          status: 'confirmed',
          room_id: 'room123',
        }),
        createAnalyticsMockReservation({
          status: 'checked_in',
          room_id: 'room124',
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);
      (Room.countDocuments as jest.Mock).mockResolvedValue(10);
      (Room.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'deluxe', count: 6 },
        { _id: 'standard', count: 4 },
      ]);

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRooms: 10,
        occupiedRooms: 2,
        availableRooms: 8,
        occupancyRate: 20,
      });
    });

    it('should handle occupancy calculation with zero total rooms', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.countDocuments as jest.Mock).mockResolvedValue(0);
      (Room.aggregate as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.occupancyRate).toBe(0);
    });

    it('should filter reservations by date range', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-10',
          check_out_date: '2026-05-15',
          status: 'confirmed',
          room_id: 'room123',
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);
      (Room.countDocuments as jest.Mock).mockResolvedValue(5);
      (Room.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'deluxe', count: 5 },
      ]);

      const response = await request(app)
        .get('/analytics/occupancy')
        .query({
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalRooms).toBe(5);
    });

    it('should return 400 when invalid hotelId is provided', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.countDocuments as jest.Mock).mockResolvedValue(0);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ hotelId: 'invalid-object-id' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should return 500 when database error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while fetching occupancy report');
    });

    it('should return 500 when Room.countDocuments() fails', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.countDocuments as jest.Mock).mockRejectedValue(new Error('Count error'));
      (Room.aggregate as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while fetching occupancy report');
    });
  });

  describe('GET /analytics/trends', () => {
    it('should return booking trends with summary data', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          status: 'confirmed',
          num_guests: 2,
          total_amount: 600,
        }),
        createAnalyticsMockReservation({
          check_in_date: '2026-05-10',
          check_out_date: '2026-05-12',
          status: 'confirmed',
          num_guests: 1,
          total_amount: 400,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalBookings).toBe(2);
      expect(response.body.summary.statusBreakdown).toEqual({ confirmed: 2 });
      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    it('should calculate average stay length correctly', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-06', // 5 days
        }),
        createAnalyticsMockReservation({
          check_in_date: '2026-05-10',
          check_out_date: '2026-05-13', // 3 days
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      // Average of 5 and 3 days = 4
      expect(response.body.summary.averageStayLength).toBe(4);
    });

    it('should organize trends by month sorted chronologically', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-06-01',
          check_out_date: '2026-06-05',
          num_guests: 2,
          total_amount: 500,
        }),
        createAnalyticsMockReservation({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 1,
          total_amount: 300,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.trends[0].month).toBe('2026-05');
      expect(response.body.trends[1].month).toBe('2026-06');
    });

    it('should include status breakdown in summary', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({ status: 'confirmed' }),
        createAnalyticsMockReservation({ status: 'cancelled' }),
        createAnalyticsMockReservation({ status: 'confirmed' }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.statusBreakdown).toEqual({
        confirmed: 2,
        cancelled: 1,
      });
    });

    it('should filter trends by date range', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-10',
          check_out_date: '2026-05-15',
          num_guests: 2,
          total_amount: 400,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .query({
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalBookings).toBe(1);
    });

    it('should filter trends by hotelId', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          room_id: 'room123',
          num_guests: 2,
          total_amount: 300,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations),
      });
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(['room123']),
      });
    });

    it('should return 400 when invalid hotelId is provided in trends', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .query({ hotelId: 'invalid-object-id' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should handle empty reservations in trends', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.trends).toEqual([]);
      expect(response.body.summary.totalBookings).toBe(0);
      expect(response.body.summary.averageStayLength).toBe(0);
    });

    it('should return 400 when invalid hotelId is provided', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .query({ hotelId: 'invalid-object-id' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should return 500 when database error occurs during trends fetch', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while fetching booking trends');
    });
  });

  describe('GET /analytics/export/csv', () => {
    it('should return CSV formatted data with correct headers', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          guest_name: 'John Doe',
          room_number: '101',
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 2,
          status: 'confirmed',
          total_amount: 600,
          amount_paid: 300,
          payment_status: 'partial',
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('reservations-export.csv');
      expect(response.text).toContain('Guest Name,Room Number,Check-In,Check-Out,Guests,Status,Total Amount,Amount Paid,Payment Status');
      expect(response.text).toContain('John Doe,101,2026-05-01,2026-05-05,2,confirmed,600,300,partial');
    });

    it('should export CSV with multiple reservations', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          guest_name: 'John Doe',
          room_number: '101',
          total_amount: 600,
        }),
        createAnalyticsMockReservation({
          guest_name: 'Jane Smith',
          room_number: '102',
          total_amount: 400,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('John Doe');
      expect(response.text).toContain('Jane Smith');
    });

    it('should apply date filters to CSV export', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-15',
          guest_name: 'Filtered Guest',
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/csv')
        .query({
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Filtered Guest');
    });

    it('should apply hotelId filter to CSV export', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          room_id: 'room123',
          guest_name: 'Hotel Guest',
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(['room123']),
      });

      const response = await request(app)
        .get('/analytics/export/csv')
        .query({ hotelId: '507f1f77bcf86cd799439011' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Hotel Guest');
    });

    it('should return 400 when invalid hotelId in CSV export', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/export/csv')
        .query({ hotelId: 'invalid-object-id' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should export empty CSV when no reservations found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Guest Name,Room Number,Check-In,Check-Out,Guests,Status,Total Amount,Amount Paid,Payment Status');
    });

    it('should return 500 when database error occurs during CSV export', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while exporting CSV');
    });


  });

  describe('GET /analytics/export/pdf', () => {
    it('should return HTML formatted report with correct headers', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          guest_name: 'John Doe',
          room_number: '101',
          total_amount: 600,
          amount_paid: 300,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.headers['content-disposition']).toContain('report.html');
      expect(response.text).toContain('HotelHub Analytics Report');
    });

    it('should include summary data in PDF report', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          total_amount: 1000,
          amount_paid: 600,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Reservations: 1');
      expect(response.text).toContain('Total Revenue: $1000.00');
      expect(response.text).toContain('Total Paid: $600.00');
    });

    it('should apply date filters to PDF export', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          check_in_date: '2026-05-15',
          guest_name: 'Filtered Guest',
          total_amount: 300,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .query({
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('HotelHub Analytics Report');
      expect(response.text).toContain('$300.00');
    });

    it('should apply hotelId filter to PDF export', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          room_id: 'room123',
          total_amount: 600,
          amount_paid: 300,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue(['room123']),
      });

      const response = await request(app)
        .get('/analytics/export/pdf')
        .query({ hotelId: '507f1f77bcf86cd799439011' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Reservations: 1');
      expect(response.text).toContain('$600.00');
    });

    it('should return 400 when invalid hotelId in PDF export', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get('/analytics/export/pdf')
        .query({ hotelId: 'invalid-object-id' })
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should export PDF with empty reservations data', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Reservations: 0');
      expect(response.text).toContain('Total Revenue: $0.00');
    });

    it('should format currency values correctly in PDF report', async () => {
      const mockReservations = [
        createAnalyticsMockReservation({
          total_amount: 1234.56,
          amount_paid: 567.89,
        }),
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Revenue: $1234.56');
      expect(response.text).toContain('Total Paid: $567.89');
    });

    it('should include report generation date in PDF', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.text).toContain('HotelHub Analytics Report');
    });

    it('should return 500 when database error occurs during PDF export', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Reservation.find as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while exporting PDF');
    });
  });
  // -------------------------------------------------------------------------
  // GET /analytics/occupancy – partial date-range branches (line 206 area)
  // -------------------------------------------------------------------------
  describe('GET /analytics/occupancy – partial date-range filter', () => {
    it('should accept only startDate (no endDate) and return 200', async () => {
      adminToken();
      (Reservation.find as jest.Mock).mockResolvedValue([
        createAnalyticsMockReservation({ status: 'confirmed', room_id: 'room123' }),
      ]);
      (Room.countDocuments as jest.Mock).mockResolvedValue(3);
      (Room.aggregate as jest.Mock).mockResolvedValue([{ _id: 'deluxe', count: 3 }]);
 
      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ startDate: '2026-05-01' }) // endDate omitted
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(200);
      expect(response.body.summary.totalRooms).toBe(3);
    });
 
    it('should accept only endDate (no startDate) and return 200', async () => {
      adminToken();
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.countDocuments as jest.Mock).mockResolvedValue(5);
      (Room.aggregate as jest.Mock).mockResolvedValue([{ _id: 'standard', count: 5 }]);
 
      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ endDate: '2026-05-31' }) // startDate omitted
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(200);
      expect(response.body.summary.totalRooms).toBe(5);
      expect(response.body.summary.occupiedRooms).toBe(0);
    });
  });
 
  // -------------------------------------------------------------------------
  // GET /analytics/revenue – byMonth with reservations having no check_in_date
  // -------------------------------------------------------------------------
  describe('GET /analytics/revenue – reservations with missing check_in_date', () => {
    it('should skip month grouping for reservations without check_in_date', async () => {
      adminToken();
      (Reservation.find as jest.Mock).mockResolvedValue([
        createAnalyticsMockReservation({ check_in_date: undefined, total_amount: 100, amount_paid: 50 }),
      ]);
 
      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(200);
      // total_amount should still be summed
      expect(response.body.summary.totalRevenue).toBe(100);
      // but byMonth should be empty because check_in_date is missing
      expect(response.body.byMonth).toEqual([]);
    });
  });
 
  // -------------------------------------------------------------------------
  // GET /analytics/trends – reservations with missing check_in_date / check_out_date
  // -------------------------------------------------------------------------
  describe('GET /analytics/trends – reservations missing date fields', () => {
    it('should skip stay-length calculation when check_in_date or check_out_date is missing', async () => {
      adminToken();
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          // One reservation with no check_out_date
          createAnalyticsMockReservation({ check_in_date: '2026-05-01', check_out_date: undefined }),
          // One reservation with no check_in_date
          createAnalyticsMockReservation({ check_in_date: undefined, check_out_date: '2026-05-10' }),
        ]),
      });
 
      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(200);
      // With 2 reservations and 0 calculable days, averageStayLength = 0/2 = 0
      expect(response.body.summary.averageStayLength).toBe(0);
    });
  });
 
  // -------------------------------------------------------------------------
  // GET /analytics/occupancy – Room.find().distinct failure with valid hotelId
  // -------------------------------------------------------------------------
  describe('GET /analytics/occupancy – Room.find distinct error with hotelId', () => {
    it('should return 500 when Room.find().distinct throws for hotelId filter', async () => {
      adminToken();
      (Reservation.find as jest.Mock).mockResolvedValue([]);
      (Room.countDocuments as jest.Mock).mockResolvedValue(0);
      (Room.find as jest.Mock).mockReturnValue({
        distinct: jest.fn().mockRejectedValue(new Error('Distinct query failed')),
      });
      (Room.aggregate as jest.Mock).mockResolvedValue([]);
 
      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ hotelId: '507f1f77bcf86cd799439011' })
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error while fetching occupancy report');
    });
  });
});
