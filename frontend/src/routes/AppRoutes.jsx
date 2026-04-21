import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";

import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
// import Profile from "../pages/user/Profile";

import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <h3>Không có quyền truy cập</h3>;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          <Route
            path="/profile"
            element={
              <PrivateRoute roles={["STUDENT", "INSTRUCTOR", "ADMIN"]}>
                {/* <Profile /> */}
              </PrivateRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <PrivateRoute roles={["STUDENT", "INSTRUCTOR", "ADMIN"]}>
                {/* <Cart /> */}
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}