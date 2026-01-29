import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from "next-themes";
import { UserProvider } from './contexts/UserContext';
import HomeLayout from './layouts/HomeLayout';
import EditorLayout from './layouts/EditorLayout';
import Editor from './pages/Editor';
// import { Toaster } from './components/ui/toaster';

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
            </Route>

            {/* Editor Layout (Protected) */}
            <Route path="/editor" element={<EditorLayout />}>
              <Route index element={<Editor />} />
              {/* Add sub-routes for editor here if needed */}
            </Route>
          </Routes>
        </Router>
        {/* <Toaster /> */}
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
