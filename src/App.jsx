import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from "next-themes";
import { UserProvider } from './contexts/UserContext';
import HomeLayout from './layouts/HomeLayout';
import EditorLayout from './layouts/EditorLayout';
import Editor from './pages/Editor'; // This is the Projects List
import EditorWelcome from './pages/editor/EditorWelcome';
import AgencyPage from './pages/editor/AgencyPage';
import StopsPage from './pages/editor/StopsPage';
import RoutesPage from './pages/editor/RoutesPage';
import ShapesPage from './pages/editor/ShapesPage';
import TripsPage from './pages/editor/TripsPage';
import CalendarPage from './pages/editor/CalendarPage';
import StopTimesPage from './pages/editor/StopTimesPage';
import FrequenciesPage from './pages/editor/FrequenciesPage';
import TransfersPage from './pages/editor/TransfersPage';
import FaresPage from './pages/editor/FaresPage';
import PlaceholderPage from './pages/editor/PlaceholderPage';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        <Router>
          <Routes>
            {/* Public Layout */}
            <Route element={<HomeLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/projects" element={<Editor />} />
            </Route>

            {/* Editor Layout - Context Based Routing */}
            <Route path="/editor" element={<EditorLayout />}>
              <Route index element={<EditorWelcome />} />
              <Route path="agency" element={<AgencyPage />} />
              <Route path="stops" element={<StopsPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="shapes" element={<ShapesPage />} />
              <Route path="trips" element={<TripsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="stop-times" element={<StopTimesPage />} />
              <Route path="frequencies" element={<FrequenciesPage />} />
              <Route path="transfers" element={<TransfersPage />} />
              <Route path="fares" element={<FaresPage />} />
              <Route path="*" element={<PlaceholderPage />} />
            </Route>

          </Routes>
        </Router>
        <Toaster position="bottom-right" />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;

