/**
 * Integration tests for analytics routes.
 * Tests GET /analytics/revenue, GET /analytics/occupancy, GET /analytics/trends,
 * GET /analytics/export/csv, GET /analytics/export/pdf.
 * All analytics endpoints require admin role.
 */
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createReservation, createRoom, createHotel, createUser } from '../setup/fixtures';
import { createAuthenticatedUser, createAdmin } from '../setup/helpers';

// Valid MongoDB ObjectId format for a non-existent hotel
const VALID_HOTEL_OBJECT_ID = '507f1f77bcf86cd799439011';
const INVALID_HOTEL_ID = 'invalid-object-id';

describe('Analytics Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ---------------------------------------------------------------------------
  // Authorization (shared across all endpoints)
  // ---------------------------------------------------------------------------
  describe('Authorization', () => {
    it('should return 401 when no JWT token is provided', async () => {
      const response = await request(app).get('/analytics/revenue');
      expect(response.status).toBe(401);
    });

    it('should return 403 when a non-admin user hits /revenue', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', cookies);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when a non-admin user hits /occupancy', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', cookies);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when a non-admin user hits /trends', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', cookies);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when a non-admin user hits /export/csv', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', cookies);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 403 when a non-admin user hits /export/pdf', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', cookies);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /analytics/revenue
  // ---------------------------------------------------------------------------
  describe('GET /analytics/revenue', () => {
    it('should return empty summary when no reservations exist', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        totalReservations: 0,
      });
      expect(response.body.byStatus).toEqual({});
      expect(response.body.byMonth).toEqual([]);
    });

    it('should aggregate revenue correctly across multiple reservations', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-05',
        total_amount: 400,
        amount_paid: 400,
        payment_status: 'paid',
        status: 'confirmed',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-10',
        check_out_date: '2026-05-12',
        total_amount: 200,
        amount_paid: 100,
        payment_status: 'partial',
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRevenue: 600,
        totalPaid: 500,
        totalPending: 100,
        totalReservations: 2,
      });
    });

    it('should group revenue by payment status', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-03',
        total_amount: 300,
        amount_paid: 300,
        payment_status: 'paid',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-03',
        total_amount: 200,
        amount_paid: 0,
        payment_status: 'pending',
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.byStatus).toEqual({
        paid: 300,
        pending: 200,
      });
    });

    it('should group revenue by month in chronological order', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-05',
        total_amount: 500,
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-15',
        check_out_date: '2026-05-18',
        total_amount: 300,
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.byMonth[0]).toEqual({ month: '2026-05', revenue: 300 });
      expect(response.body.byMonth[1]).toEqual({ month: '2026-06', revenue: 500 });
    });

    it('should filter by startDate and endDate', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      // Inside range
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-10',
        check_out_date: '2026-05-12',
        total_amount: 200,
        amount_paid: 200,
      });
      // Outside range
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-07-01',
        check_out_date: '2026-07-03',
        total_amount: 400,
        amount_paid: 400,
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ startDate: '2026-05-01', endDate: '2026-05-31' })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalRevenue).toBe(200);
      expect(response.body.summary.totalReservations).toBe(1);
    });

    it('should filter by hotelId and only include that hotel\'s reservations', async () => {
      const { cookies } = await createAdmin();
      const hotel1 = await createHotel({ name: 'Hotel Alpha' });
      const hotel2 = await createHotel({ name: 'Hotel Beta' });
      const room1 = await createRoom({ hotel_id: hotel1._id });
      const room2 = await createRoom({ hotel_id: hotel2._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-03',
        total_amount: 300,
        amount_paid: 300,
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        check_in_date: '2026-05-05',
        check_out_date: '2026-05-07',
        total_amount: 500,
        amount_paid: 500,
      });

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ hotelId: hotel1._id.toString() })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalRevenue).toBe(300);
      expect(response.body.summary.totalReservations).toBe(1);
    });

    it('should return 400 for an invalid hotelId format', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ hotelId: INVALID_HOTEL_ID })
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });

    it('should return empty results for a valid but non-existent hotelId', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/revenue')
        .query({ hotelId: VALID_HOTEL_OBJECT_ID })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalReservations).toBe(0);
      expect(response.body.summary.totalRevenue).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /analytics/occupancy
  // ---------------------------------------------------------------------------
  describe('GET /analytics/occupancy', () => {
    it('should return zero occupancy when no rooms or reservations exist', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalRooms: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        occupancyRate: 0,
      });
      expect(Array.isArray(response.body.byRoomType)).toBe(true);
    });

    it('should calculate occupancy rate from confirmed and checked_in reservations', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room1 = await createRoom({ hotel_id: hotel._id, room_number: '101' });
      const room2 = await createRoom({ hotel_id: hotel._id, room_number: '102' });
      const room3 = await createRoom({ hotel_id: hotel._id, room_number: '103' });
      const room4 = await createRoom({ hotel_id: hotel._id, room_number: '104' });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        status: 'confirmed',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        status: 'checked_in',
      });
      // Cancelled reservation — should NOT count as occupied
      await createReservation({
        guest_id: guest._id,
        room_id: room3._id,
        status: 'cancelled',
      });

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      // 4 rooms total; 2 occupied (confirmed + checked_in); 1 cancelled ignored
      expect(response.body.summary.totalRooms).toBe(4);
      expect(response.body.summary.occupiedRooms).toBe(2);
      expect(response.body.summary.availableRooms).toBe(2);
      expect(response.body.summary.occupancyRate).toBe(50);
    });

    it('should restrict occupancy calculation to a specific hotel when hotelId is provided', async () => {
      const { cookies } = await createAdmin();
      const hotel1 = await createHotel({ name: 'Hotel Alpha' });
      const hotel2 = await createHotel({ name: 'Hotel Beta' });
      const room1 = await createRoom({ hotel_id: hotel1._id, room_number: '101' });
      const room2 = await createRoom({ hotel_id: hotel1._id, room_number: '102' });
      // Rooms belonging to the other hotel — should not affect the result
      await createRoom({ hotel_id: hotel2._id, room_number: '201' });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ hotelId: hotel1._id.toString() })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalRooms).toBe(2);
      expect(response.body.summary.occupiedRooms).toBe(1);
      expect(response.body.summary.availableRooms).toBe(1);
      expect(response.body.summary.occupancyRate).toBe(50);
    });

    it('should include byRoomType breakdown', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      await createRoom({ hotel_id: hotel._id, room_number: '101', room_type: 'standard' });
      await createRoom({ hotel_id: hotel._id, room_number: '102', room_type: 'standard' });
      await createRoom({ hotel_id: hotel._id, room_number: '103', room_type: 'deluxe' });

      const response = await request(app)
        .get('/analytics/occupancy')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.byRoomType)).toBe(true);

      const standardEntry = response.body.byRoomType.find((e: any) => e._id === 'standard');
      const deluxeEntry = response.body.byRoomType.find((e: any) => e._id === 'deluxe');
      expect(standardEntry).toBeDefined();
      expect(standardEntry.count).toBe(2);
      expect(deluxeEntry).toBeDefined();
      expect(deluxeEntry.count).toBe(1);
    });

    it('should filter reservations by date range', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room1 = await createRoom({ hotel_id: hotel._id, room_number: '101' });
      const room2 = await createRoom({ hotel_id: hotel._id, room_number: '102' });
      const guest = await createUser();

      // Reservation within the date range
      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        check_in_date: '2026-05-10',
        check_out_date: '2026-05-15',
        status: 'confirmed',
      });
      // Reservation outside the date range
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        check_in_date: '2026-09-01',
        check_out_date: '2026-09-05',
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ startDate: '2026-05-01', endDate: '2026-05-31' })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      // Only the May reservation falls in range, so only 1 occupied room
      expect(response.body.summary.occupiedRooms).toBe(1);
    });

    it('should return 400 for an invalid hotelId format', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/occupancy')
        .query({ hotelId: INVALID_HOTEL_ID })
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /analytics/trends
  // ---------------------------------------------------------------------------
  describe('GET /analytics/trends', () => {
    it('should return empty trends when no reservations exist', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.trends).toEqual([]);
      expect(response.body.summary).toEqual({
        totalBookings: 0,
        averageStayLength: 0,
        statusBreakdown: {},
      });
    });

    it('should aggregate bookings by month in chronological order', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-04',
        num_guests: 2,
        total_amount: 300,
        status: 'confirmed',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-10',
        check_out_date: '2026-05-13',
        num_guests: 1,
        total_amount: 150,
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.trends[0].month).toBe('2026-05');
      expect(response.body.trends[1].month).toBe('2026-06');
    });

    it('should calculate trend metrics per month correctly', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-04',
        num_guests: 2,
        total_amount: 300,
        status: 'confirmed',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-15',
        check_out_date: '2026-05-17',
        num_guests: 3,
        total_amount: 200,
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      const mayTrend = response.body.trends.find((t: any) => t.month === '2026-05');
      expect(mayTrend).toBeDefined();
      expect(mayTrend.count).toBe(2);
      expect(mayTrend.revenue).toBe(500);
      expect(mayTrend.guests).toBe(5);
    });

    it('should calculate average stay length correctly', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      // 5-night stay
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-06',
      });
      // 3-night stay
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-10',
        check_out_date: '2026-05-13',
      });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      // Average of 5 and 3 nights = 4
      expect(response.body.summary.averageStayLength).toBe(4);
    });

    it('should produce a correct status breakdown in summary', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({ guest_id: guest._id, room_id: room._id, status: 'confirmed' });
      await createReservation({ guest_id: guest._id, room_id: room._id, status: 'confirmed' });
      await createReservation({ guest_id: guest._id, room_id: room._id, status: 'cancelled' });

      const response = await request(app)
        .get('/analytics/trends')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.statusBreakdown).toEqual({
        confirmed: 2,
        cancelled: 1,
      });
      expect(response.body.summary.totalBookings).toBe(3);
    });

    it('should filter trends by date range', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-10',
        check_out_date: '2026-05-13',
        status: 'confirmed',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-08-01',
        check_out_date: '2026-08-04',
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/trends')
        .query({ startDate: '2026-05-01', endDate: '2026-05-31' })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalBookings).toBe(1);
      expect(response.body.trends).toHaveLength(1);
      expect(response.body.trends[0].month).toBe('2026-05');
    });

    it('should filter trends by hotelId', async () => {
      const { cookies } = await createAdmin();
      const hotel1 = await createHotel({ name: 'Hotel Alpha' });
      const hotel2 = await createHotel({ name: 'Hotel Beta' });
      const room1 = await createRoom({ hotel_id: hotel1._id });
      const room2 = await createRoom({ hotel_id: hotel2._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-03',
        status: 'confirmed',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        check_in_date: '2026-05-05',
        check_out_date: '2026-05-07',
        status: 'confirmed',
      });

      const response = await request(app)
        .get('/analytics/trends')
        .query({ hotelId: hotel1._id.toString() })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalBookings).toBe(1);
    });

    it('should return 400 for an invalid hotelId format', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/trends')
        .query({ hotelId: INVALID_HOTEL_ID })
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /analytics/export/csv
  // ---------------------------------------------------------------------------
  describe('GET /analytics/export/csv', () => {
    it('should return CSV with correct headers even when no reservations exist', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('reservations-export.csv');
      expect(response.text).toContain(
        'Guest Name,Room Number,Check-In,Check-Out,Guests,Status,Total Amount,Amount Paid,Payment Status'
      );
    });

    it('should include a data row for each reservation', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id, room_number: '101' });
      const guest = await createUser({ full_name: 'Alice Smith' });

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-01',
        check_out_date: '2026-05-05',
        num_guests: 2,
        status: 'confirmed',
        total_amount: 400,
        amount_paid: 400,
        payment_status: 'paid',
        guest_name: 'Alice Smith',
        room_number: '101',
      });

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Alice Smith');
      expect(response.text).toContain('101');
      expect(response.text).toContain('2026-05-01');
      expect(response.text).toContain('2026-05-05');
      expect(response.text).toContain('confirmed');
      expect(response.text).toContain('400');
      expect(response.text).toContain('paid');
    });

    it('should export rows for multiple reservations', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room1 = await createRoom({ hotel_id: hotel._id, room_number: '201' });
      const room2 = await createRoom({ hotel_id: hotel._id, room_number: '202' });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        guest_name: 'Bob Jones',
        room_number: '201',
        total_amount: 200,
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        guest_name: 'Carol White',
        room_number: '202',
        total_amount: 300,
      });

      const response = await request(app)
        .get('/analytics/export/csv')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      const lines = response.text.trim().split('\n');
      // Header + 2 data rows
      expect(lines.length).toBe(3);
      expect(response.text).toContain('Bob Jones');
      expect(response.text).toContain('Carol White');
    });

    it('should apply date range filter to CSV export', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-10',
        guest_name: 'In Range Guest',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-08-01',
        guest_name: 'Out Of Range Guest',
      });

      const response = await request(app)
        .get('/analytics/export/csv')
        .query({ startDate: '2026-05-01', endDate: '2026-05-31' })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('In Range Guest');
      expect(response.text).not.toContain('Out Of Range Guest');
    });

    it('should apply hotelId filter to CSV export', async () => {
      const { cookies } = await createAdmin();
      const hotel1 = await createHotel({ name: 'Hotel Alpha' });
      const hotel2 = await createHotel({ name: 'Hotel Beta' });
      const room1 = await createRoom({ hotel_id: hotel1._id });
      const room2 = await createRoom({ hotel_id: hotel2._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        guest_name: 'Hotel Alpha Guest',
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        guest_name: 'Hotel Beta Guest',
      });

      const response = await request(app)
        .get('/analytics/export/csv')
        .query({ hotelId: hotel1._id.toString() })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Hotel Alpha Guest');
      expect(response.text).not.toContain('Hotel Beta Guest');
    });

    it('should return 400 for an invalid hotelId format', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/export/csv')
        .query({ hotelId: INVALID_HOTEL_ID })
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /analytics/export/pdf
  // ---------------------------------------------------------------------------
  describe('GET /analytics/export/pdf', () => {
    it('should return HTML report with correct headers', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.headers['content-disposition']).toContain('report.html');
    });

    it('should show zeros when no reservations exist', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('HotelHub Analytics Report');
      expect(response.text).toContain('Total Reservations: 0');
      expect(response.text).toContain('Total Revenue: $0.00');
      expect(response.text).toContain('Total Paid: $0.00');
    });

    it('should include correct summary figures in the HTML report', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        total_amount: 800,
        amount_paid: 500,
      });

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Reservations: 1');
      expect(response.text).toContain('Total Revenue: $800.00');
      expect(response.text).toContain('Total Paid: $500.00');
    });

    it('should format currency values with two decimal places', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        total_amount: 1234.5,
        amount_paid: 999.9,
      });

      const response = await request(app)
        .get('/analytics/export/pdf')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Revenue: $1234.50');
      expect(response.text).toContain('Total Paid: $999.90');
    });

    it('should apply date range filter to PDF export', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const guest = await createUser();

      // Inside range
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-05-15',
        total_amount: 300,
        amount_paid: 300,
      });
      // Outside range
      await createReservation({
        guest_id: guest._id,
        room_id: room._id,
        check_in_date: '2026-09-01',
        total_amount: 700,
        amount_paid: 700,
      });

      const response = await request(app)
        .get('/analytics/export/pdf')
        .query({ startDate: '2026-05-01', endDate: '2026-05-31' })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Reservations: 1');
      expect(response.text).toContain('Total Revenue: $300.00');
    });

    it('should apply hotelId filter to PDF export', async () => {
      const { cookies } = await createAdmin();
      const hotel1 = await createHotel({ name: 'Hotel Alpha' });
      const hotel2 = await createHotel({ name: 'Hotel Beta' });
      const room1 = await createRoom({ hotel_id: hotel1._id });
      const room2 = await createRoom({ hotel_id: hotel2._id });
      const guest = await createUser();

      await createReservation({
        guest_id: guest._id,
        room_id: room1._id,
        total_amount: 400,
        amount_paid: 400,
      });
      await createReservation({
        guest_id: guest._id,
        room_id: room2._id,
        total_amount: 600,
        amount_paid: 600,
      });

      const response = await request(app)
        .get('/analytics/export/pdf')
        .query({ hotelId: hotel1._id.toString() })
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.text).toContain('Total Reservations: 1');
      expect(response.text).toContain('Total Revenue: $400.00');
    });

    it('should return 400 for an invalid hotelId format', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .get('/analytics/export/pdf')
        .query({ hotelId: INVALID_HOTEL_ID })
        .set('Cookie', cookies);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotelId');
    });
  });
});