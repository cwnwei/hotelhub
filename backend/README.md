Collecting workspace information# HotelHub Backend

A TypeScript-based Express.js backend for the HotelHub application with JWT authentication and role-based access control (RBAC).

## Features

- **User Authentication**: Register and login with email/password
- **JWT Tokens**: Access tokens (10m expiry) and refresh tokens (7d expiry)
- **Role-Based Access Control**: Support for `user` and `admin` roles
- **Password Hashing**: Secure password storage using bcryptjs
- **MongoDB Integration**: User data persistence with Mongoose
- **In-Memory Testing**: MongoDB Memory Server for development

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Setup Environment

Create a .env file in the backend directory with the following variables:

```
ACCESS_TOKEN_SECRET=your_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_secret_key_here
PORT=3000
```

### Development

Run the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── routes/
│   └── auth.ts           # Authentication endpoints
├── models/
│   └── User.ts           # User schema and model
├── middleware/
│   └── rbac.ts           # Role-based access control middleware
└── utils/
    └── generateToken.ts  # JWT token generation utilities
```

## API Endpoints

### Authentication Routes (`/auth`)

- **POST `/auth/register`** - Register a new user
  - Body: `{ email, password, role }`

- **POST `/auth/login`** - Login user
  - Body: `{ email, password }`
  - Returns: `{ jwt_token }`
  - Sets: `refreshToken` cookie

- **POST `/auth/logout`** - Logout user
  - Clears refresh token

- **POST `/auth/refresh`** - Refresh access token
  - Returns: New JWT access token

## Middleware

### authorizeRoles

Role-based authorization middleware. Verifies JWT and checks user role.

Usage:
```typescript
app.get("/admin", authorizeRoles('admin'), (req, res) => {
    // Only accessible by admin role
});
```

## Technologies

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** & **Mongoose** - Database
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment configuration

## Development Tools

- **tsx** - TypeScript execution for development
- **MongoDB Memory Server** - In-memory database for testing