import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Fullscreen standalone routes (Screens 01 & 05 + 05 Popup) */}
        <Route path="/login" element={<Login />} />
        <Route path="/kiosk" element={<Kiosk />} />

        {/* Enterprise Admin Console routes (Screens 02, 03, 04, 06, 07, 08, 09, 10, 10.1, 11, 12) */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
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
