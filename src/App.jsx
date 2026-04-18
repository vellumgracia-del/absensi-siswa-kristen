import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check local storage for session
    const savedUser = localStorage.getItem('sarkris_user');
    const savedAdmin = localStorage.getItem('sarkris_admin');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLoginStudent = (userData) => {
    setUser(userData);
    localStorage.setItem('sarkris_user', JSON.stringify(userData));
  };

  const handleLoginAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('sarkris_admin', 'true');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('sarkris_user');
    localStorage.removeItem('sarkris_admin');
  };

  return (
    <BrowserRouter>
      <div className="w-full h-screen font-sans">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/student" /> : 
              isAdmin ? <Navigate to="/admin" /> : 
              <Login onLoginStudent={handleLoginStudent} onLoginAdmin={handleLoginAdmin} />
            } 
          />
          <Route 
            path="/student" 
            element={user ? <StudentDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
