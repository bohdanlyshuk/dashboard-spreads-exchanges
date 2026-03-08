import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PricesPage from "./pages/PricesPage";
import SpreadHistoryPage from "./pages/SpreadHistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/prices" replace />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="spread-history" element={<SpreadHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
