import User from '../../../src/models/User';
import Hotel from '../../../src/models/Hotel';
import Room from '../../../src/models/Room';
import Reservation from '../../../src/models/Reservation';
import bcrypt from 'bcryptjs';

// Constants for default test data
const DEFAULT_PASSWORD = 'password123';
const BCRYPT_ROUNDS = 10;
const DEFAULT_USER_NAME = 'Test User';
const DEFAULT_HOTEL_NAME = 'Test Hotel';
const DEFAULT_PHONE = '1234567890';
const DEFAULT_HOTEL_PHONE = '+1234567890';
const DEFAULT_ADDRESS = '123 Test St';
const DEFAULT_CITY = 'Test City';
const DEFAULT_COUNTRY = 'Test Country';
const DEFAULT_STAR_RATING = 4;
const DEFAULT_ROOM_TYPE = 'standard';
const DEFAULT_FLOOR = 1;
const DEFAULT_PRICE_PER_NIGHT = 100;
const DEFAULT_MAX_GUESTS = '2';
const DEFAULT_AMENITIES = ['WiFi', 'TV'];
const DEFAULT_STATUS = 'available';
const DEFAULT_CHECK_IN = '2026-06-01';
const DEFAULT_CHECK_OUT = '2026-06-05';
const DEFAULT_NUM_GUESTS = 2;
const DEFAULT_TOTAL_AMOUNT = 400;
const DEFAULT_RESERVATION_STATUS = 'confirmed';

// TypeScript interfaces for function options
interface CreateUserOptions {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

interface CreateHotelOptions {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  star_rating?: number;
}

interface CreateRoomOptions {
  hotel_id?: any;
  room_number?: string;
  room_type?: string;
  floor?: number;
  price_per_night?: number;
  max_guests?: string;
  amenities?: string[];
  status?: string;
}

interface CreateReservationOptions {
  guest_id?: any;
  room_id?: any;
  check_in_date?: string;
  check_out_date?: string;
  num_guests?: number;
  total_amount?: number;
  amount_paid?: number;
  payment_status?: string;
  guest_name?: string;
  room_number?: string;
  status?: string;
}

/**
 * Creates a test user in the database.
 * @param overrides - Optional fields to override default user values
 * @returns Promise resolving to the created User document
 */
export const createUser = async (overrides: Partial<CreateUserOptions> = {}): Promise<any> => {
  const defaultUser = {
    full_name: DEFAULT_USER_NAME,
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    phone: DEFAULT_PHONE,
    password: await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS),
    role: 'user',
  };
  return await User.create({ ...defaultUser, ...overrides } as any);
};

/**
 * Creates a test hotel in the database.
 * @param overrides - Optional fields to override default hotel values
 * @returns Promise resolving to the created Hotel document
 */
export const createHotel = async (overrides: Partial<CreateHotelOptions> = {}): Promise<any> => {
  const defaultHotel = {
    name: DEFAULT_HOTEL_NAME,
    address: DEFAULT_ADDRESS,
    city: DEFAULT_CITY,
    country: DEFAULT_COUNTRY,
    phone: DEFAULT_HOTEL_PHONE,
    email: 'hotel@test.com',
    star_rating: DEFAULT_STAR_RATING,
  };
  return await Hotel.create({ ...defaultHotel, ...overrides });
};

/**
 * Creates a test room in the database.
 * If no hotel_id is provided, a new hotel will be created.
 * @param overrides - Optional fields to override default room values
 * @returns Promise resolving to the created Room document
 */
export const createRoom = async (overrides: Partial<CreateRoomOptions> = {}): Promise<any> => {
  let hotelId = overrides.hotel_id;
  if (!hotelId) {
    const hotel = await createHotel();
    hotelId = hotel._id.toString();
  }
  const defaultRoom = {
    hotel_id: hotelId,
    room_number: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    room_type: DEFAULT_ROOM_TYPE,
    floor: DEFAULT_FLOOR,
    price_per_night: DEFAULT_PRICE_PER_NIGHT,
    max_guests: DEFAULT_MAX_GUESTS,
    amenities: DEFAULT_AMENITIES,
    status: DEFAULT_STATUS,
  };
  return await Room.create({ ...defaultRoom, ...overrides } as any);
};

/**
 * Creates a test reservation in the database.
 * If no guest_id is provided, a new user will be created.
 * If no room_id is provided, a new room will be created.
 * @param overrides - Optional fields to override default reservation values
 * @returns Promise resolving to the created Reservation document
 */
export const createReservation = async (overrides: Partial<CreateReservationOptions> = {}): Promise<any> => {
  let guestId = overrides.guest_id;
  if (!guestId) {
    const user = await createUser();
    guestId = user._id.toString();
  }
  let roomId = overrides.room_id;
  if (!roomId) {
    const room = await createRoom();
    roomId = room._id.toString();
  }
  const defaultReservation = {
    guest_id: guestId,
    room_id: roomId,
    check_in_date: DEFAULT_CHECK_IN,
    check_out_date: DEFAULT_CHECK_OUT,
    num_guests: DEFAULT_NUM_GUESTS,
    total_amount: DEFAULT_TOTAL_AMOUNT,
    status: DEFAULT_RESERVATION_STATUS,
  };
  return await Reservation.create({ ...defaultReservation, ...overrides });
};
