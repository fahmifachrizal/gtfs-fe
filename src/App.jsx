import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from "next-themes";
import { UserProvider } from './contexts/UserContext';
import RootLayout from './layouts/RootLayout';
// import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        <Router>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Routes>
        </Router>
        {/* <Toaster /> */}
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
