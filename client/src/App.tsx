import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Vehicles } from "./pages/Vehicles";
import { VehicleDetail } from "./pages/VehicleDetail";
import { Bookings } from "./pages/Bookings";
import { Customers } from "./pages/Customers";
import { Maintenance } from "./pages/Maintenance";
import { Payments } from "./pages/Payments";
import { Profile } from "./pages/Profile";

function HomeRedirect() {
  const { user } = useAuth();
  if (user && (user.role === "ADMIN" || user.role === "STAFF")) {
    return <Dashboard />;
  }
  return <Navigate to="/vehicles" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute roles={["ADMIN", "STAFF"]} />}>
            <Route path="/customers" element={<Customers />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/payments" element={<Payments />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
