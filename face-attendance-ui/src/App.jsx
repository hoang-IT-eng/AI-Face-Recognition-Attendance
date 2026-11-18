import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import GuidedTour from "./components/GuidedTour";
import { startBackendProbe } from "./backendStatus";
import { initSimSync } from "./simSync";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import RegisterFace from "./pages/RegisterFace";
import Kiosk from "./pages/Kiosk";
import Monitoring from "./pages/Monitoring";
import Schedules from "./pages/Schedules";
import EditAttendance from "./pages/EditAttendance";
import BackupAttendance from "./pages/BackupAttendance";
import Reports from "./pages/Reports";
import EmployeeReportDetail from "./pages/EmployeeReportDetail";
import Alerts from "./pages/Alerts";
import PrivacySettings from "./pages/PrivacySettings";

// Root route: the console opens straight into the app. The query string is
// preserved so the guided-tour entry (/?tour=1 from the public landing)
// still reaches the tour trigger, whose first step is the login form.
function RootRedirect() {
  const location = useLocation();
  return (
    <Navigate to={{ pathname: "/login", search: location.search }} replace />
  );
}

export default function App() {
  // Đánh thức + theo dõi máy chủ AI; sẵn sàng thì tự đồng bộ dữ liệu mô phỏng.
  useEffect(() => {
    startBackendProbe();
    initSimSync();
  }, []);

  return (
    <BrowserRouter>
      <GuidedTour />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/kiosk" element={<Kiosk />} />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Users />} />
          <Route path="/users" element={<Navigate to="/employees" replace />} />
          <Route path="/register-face" element={<RegisterFace />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/camera" element={<Navigate to="/monitoring" replace />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/edit-attendance" element={<EditAttendance />} />
          <Route path="/backup-attendance" element={<BackupAttendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/attendance" element={<Navigate to="/reports" replace />} />
          <Route path="/reports/:code" element={<EmployeeReportDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/privacy-settings" element={<PrivacySettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
