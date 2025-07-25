import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/app-layout";
import NotMatch from "./pages/NotMatch";
import Home from "./pages/Home";

export default function Router() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="" element={<Home />} />
        <Route path="*" element={<NotMatch />} />
      </Route>
    </Routes>
  );
}
