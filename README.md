# HotelHub - Hotel Management System

A modern hotel management and booking application built with React, featuring role-based access control and comprehensive reservation management.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Test Credentials](#test-credentials)
- [Routing Guide](#routing-guide)

## Features

### Guest Features
- Browse available hotel rooms
- Search and filter rooms by check-in/check-out dates and guest count
- View room details and pricing
- Book rooms
- Manage personal reservations
- View booking history

### Admin/Staff Features
- Access protected dashboard
- Manage rooms inventory
- View and manage guest information
- Handle all reservations
- System management

### Authentication Features
- Role-based access control (Guest, Staff, Admin)
- Secure login/logout
- Session management with localStorage
- Protected routes based on user roles
- Automatic redirects based on authentication state

## Architecture

### Tech Stack
- **Frontend Framework**: React 18
- **Routing**: React Router v6
- **State Management**: React Context API
- **UI Components**: Custom components with Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form

### Key Components

- **AuthContext**: Manages authentication state, user roles, and login/logout logic
- **App.jsx**: Main routing configuration with role-based route protection
- **Layout.jsx**: Sidebar navigation for admin/staff users
- **Home.jsx**: Public landing page accessible to all users

## Authentication & Authorization

### User Roles

1. **Guest**
   - Can browse rooms without authentication
   - Must log in to book rooms
   - Can access BookRoom and MyReservations pages
   - Cannot access admin dashboard pages

2. **Staff**
   - Full access to dashboard and management pages
   - Cannot access guest booking pages
   - Redirected to Dashboard on login

3. **Admin**
   - Full system access
   - Same permissions as Staff
   - Redirected to Dashboard on login

### Auth Flow

```
Unauthenticated User
    ↓
Home Page (Landing)
    ↓
Click Login → Login Page
    ↓
    ├─ Login as Guest → Redirected to Home
    ├─ Login as Staff/Admin → Redirected to Dashboard
    └─ Invalid Credentials → Error message
    
Authenticated Guest
    ↓
    ├─ Access Home → Home Page ✓
    ├─ Access BookRoom → BookRoom Page ✓
    ├─ Access MyReservations → MyReservations Page ✓
    ├─ Access Dashboard → Redirected to Home ✗
    └─ Click Logout → Redirected to Home
    
Authenticated Staff/Admin
    ↓
    ├─ Access Home → Redirected to Dashboard
    ├─ Access Dashboard → Dashboard with Sidebar ✓
    ├─ Access Rooms → Rooms Page ✓
    ├─ Access Guests → Guests Page ✓
    ├─ Access Reservations → Reservations Page ✓
    ├─ Access BookRoom → Redirected to Dashboard ✗
    └─ Click Logout → Redirected to Home
```

## Project Structure

```
hotelhub/
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── badge.jsx
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   └── ...
│   │   ├── dashboard/          # Dashboard components
│   │   └── UserNotRegisteredError.jsx
│   ├── pages/
│   │   ├── Home.jsx            # Public landing page
│   │   ├── Login.jsx           # Login page
│   │   ├── BookRoom.jsx        # Room booking (Guest only)
│   │   ├── MyReservation.jsx   # Reservation management (Guest only)
│   │   ├── Dashboard.jsx       # Admin dashboard
│   │   ├── Rooms.jsx           # Room management
│   │   ├── Guests.jsx          # Guest management
│   │   └── Reservations.jsx    # Reservation management
│   ├── lib/
│   │   ├── AuthContext.jsx     # Authentication state & logic
│   │   ├── NavigationTracker.jsx
│   │   ├── PageNotFound.jsx
│   │   ├── query-client.js
│   │   └── utils.js
│   ├── utils/
│   │   └── index.ts
│   ├── App.jsx                 # Main routing configuration
│   ├── Layout.jsx              # Admin sidebar layout
│   ├── pages.config.js         # Page configuration
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   cd hotelhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Lint code**
   ```bash
   npm run lint
   npm run lint:fix  # Auto-fix linting issues
   ```

## Usage

### Public Pages
- **Home** (`/`): Landing page with room showcase and search functionality
- **Login** (`/login`): Authentication page

### Guest Pages
- **BookRoom** (`/BookRoom`): Browse and book available rooms
- **MyReservations** (`/MyReservations`): View and manage personal reservations

### Admin/Staff Pages
- **Dashboard** (`/Dashboard`): Main dashboard
- **Rooms** (`/Rooms`): Manage room inventory
- **Guests** (`/Guests`): Manage guest information
- **Reservations** (`/Reservations`): Manage all reservations

### Navigation
- The Navigation Bar is available on the Home page with Login/Logout buttons
- The Sidebar is available on all admin/staff pages for quick navigation
- Use the back button or navigation links to move between pages

## Test Credentials

### Guest Account
```
Username: guest
Password: password123
```

### Staff Account
```
Username: staff
Password: password123
```

### Admin Account
```
Username: admin
Password: password123
```

**Note**: These are test credentials for development. Replace with proper authentication when implementing real backend authentication.

## Routing Guide

### Protected Routes with Role-Based Access

| Route | Role | Access |
|-------|------|--------|
| `/` | All | ✓ (Home redirects admin/staff to Dashboard) |
| `/login` | All | ✓ |
| `/BookRoom` | Guest | ✓ |
| `/BookRoom` | Admin/Staff | ✗ (Redirects to Dashboard) |
| `/MyReservations` | Guest | ✓ |
| `/MyReservations` | Admin/Staff | ✗ (Redirects to Dashboard) |
| `/Dashboard` | Admin/Staff | ✓ |
| `/Dashboard` | Guest | ✗ (Redirects to Home) |
| `/Rooms` | Admin/Staff | ✓ |
| `/Guests` | Admin/Staff | ✓ |
| `/Reservations` | Admin/Staff | ✓ |
| `/404` | All | ✓ (Auto-shown for undefined routes) |

### Redirect Behavior

**On Login:**
- Guest → Home page
- Staff/Admin → Dashboard page

**On Logout:**
- All users → Home page

**On Page Access:**
- Unauthenticated users accessing protected routes → Login page
- Guests accessing admin routes → Home page
- Admin/Staff accessing guest routes → Dashboard page
- Admin/Staff visiting Home → Dashboard page

## Key Features Implemented

- ✅ Role-based access control
- ✅ Protected routes and redirects
- ✅ Guest booking system
- ✅ Reservation management
- ✅ Admin dashboard with sidebar
- ✅ Authentication state persistence
- ✅ Logout functionality
- ✅ Navigation guards
- ✅ User role detection
- ✅ Responsive design with Tailwind CSS

## Future Enhancements

- [ ] Backend API integration
- [ ] Real authentication system
- [ ] Payment processing
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Room availability calendar
- [ ] User profile management
- [ ] Admin analytics and reporting

## Troubleshooting

### Navigation not clickable
- Ensure z-index values are properly set
- Check for `pointer-events-none` only on overlay elements

### Auth state not persisting
- Verify localStorage is enabled
- Check AuthContext for state updates

### Redirects not working
- Verify useNavigate is properly imported
- Check auth state in useEffect dependencies

## Development Notes

- Authentication uses localStorage for testing purposes
- All user data is stored client-side
- Consider implementing proper backend authentication
- Add form validation and error handling
- Implement actual API calls for data operations

---

**Last Updated**: February 7, 2026  
**Version**: 1.0.0
