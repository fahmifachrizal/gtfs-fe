import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from "next-themes";
import { UserProvider } from './contexts/UserContext';
import HomeLayout from './layouts/HomeLayout';
import EditorLayout from './layouts/EditorLayout';
import Editor from './pages/Editor'; // This is the Projects List
import EditorWelcome from './pages/editor/EditorWelcome'; // New component
import StopsPage from './pages/editor/StopsPage';
import RoutesPage from './pages/editor/RoutesPage';
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
                <Route path="stops" element={<StopsPage />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="*" element={<PlaceholderPage />} />
            </Route>

          </Routes>
        </Router>
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
