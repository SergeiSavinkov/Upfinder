import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import FoundItemDetails from "./pages/FoundItemDetails/FoundItemDetails"
import LostItemDetails from "./pages/LostItemDetails/LostItemDetails"
import CreateEditReport from "./pages/CreateEditReport/CreateEditReport"

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-edit-report" element={<CreateEditReport />} />
                <Route path="/create-edit-report/:id" element={<CreateEditReport />} />
                <Route path="/found-item-details/:id" element={<FoundItemDetails />} />
                <Route path="/found-item-details" element={<FoundItemDetails />} />
                <Route path="lost-item-details/:id" element={<LostItemDetails />} />
                <Route path="/lost-item-details" element={<LostItemDetails />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
