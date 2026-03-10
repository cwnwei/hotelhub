import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import Reservations from './pages/Reservations';
import Hotels from './pages/Hotels';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Dashboard": Dashboard,
    "Rooms": Rooms,
    "Guests": Guests,
    "Reservations": Reservations,
    "Hotels": Hotels,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};