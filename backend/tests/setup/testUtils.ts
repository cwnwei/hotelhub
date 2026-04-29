// Mock data factories for tests

export const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  password: 'hashedPassword123',
  role: 'customer',
  refreshToken: '',
  toJSON: jest.fn().mockReturnValue({
    _id: 'user123',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'customer',
  }),
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

export const createMockAdmin = (overrides = {}) => ({
  _id: 'admin123',
  full_name: 'Admin User',
  email: 'admin@example.com',
  phone: '9876543210',
  password: 'hashedPassword456',
  role: 'admin',
  refreshToken: '',
  toJSON: jest.fn().mockReturnValue({
    _id: 'admin123',
    full_name: 'Admin User',
    email: 'admin@example.com',
    phone: '9876543210',
    role: 'admin',
  }),
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

export const createMockRoom = (overrides = {}) => ({
  _id: 'room123',
  hotel: 'hotel123',
  room_number: '101',
  type: 'deluxe',
  price: 150,
  capacity: 2,
  amenities: ['WiFi', 'TV', 'AC'],
  status: 'available',
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

export const createMockHotel = (overrides = {}) => ({
  _id: 'hotel123',
  name: 'Grand Hotel',
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  rating: 4.5,
  amenities: ['Pool', 'Gym', 'Restaurant'],
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

export const createMockReservation = (overrides = {}) => ({
  _id: 'reservation123',
  user: 'user123',
  room: 'room123',
  hotel: 'hotel123',
  check_in: new Date('2026-05-01'),
  check_out: new Date('2026-05-05'),
  guests: 2,
  total_price: 600,
  status: 'confirmed',
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

export const createMockGuest = (overrides = {}) => ({
  _id: 'guest123',
  full_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '5551234567',
  id_number: 'ID123456',
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

// Error factory functions for consistent error mocking
export const createValidationError = (message = 'Validation failed') => {
  const error: any = new Error(message);
  error.name = 'ValidationError';
  return error;
};

export const createCastError = (message = 'Cast to ObjectId failed') => {
  const error: any = new Error(message);
  error.name = 'CastError';
  return error;
};

export const createDuplicateKeyError = (message = 'E11000 duplicate key error') => {
  const error: any = new Error(message);
  error.code = 11000;
  return error;
};

export const createJWTError = (message = 'jwt malformed') => {
  const error: any = new Error(message);
  error.name = 'JsonWebTokenError';
  return error;
};
