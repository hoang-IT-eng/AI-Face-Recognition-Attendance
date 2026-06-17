import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Stream from "./pages/Stream";
import Register from "./pages/Register";
import History from "./pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stream" element={<Stream />} />
          <Route path="/users" element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reports" element={<History />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
