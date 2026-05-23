import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import FoundItemDetails from "./pages/FoundItemDetails/FoundItemDetails"
import LostItemDetails from "./pages/LostItemDetails/LostItemDetails"
import CreateEditReport from "./pages/CreateEditReport/CreateEditReport"
import MyReports from "./pages/MyReports/MyReports"
import Profile from "./pages/Profile/Profile"
import ClaimForm from "./pages/ClaimForm/ClaimForm"
import MyClaims from "./pages/MyClaims/MyClaims"
import ClaimReview from "./pages/ClaimReview/ClaimReview"

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-reports" element={<MyReports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-claims" element={<MyClaims />} />
                <Route path="/create-edit-report" element={<CreateEditReport />} />
                <Route path="/create-edit-report/:id" element={<CreateEditReport />} />
                <Route path="/claim-form/:id" element={<ClaimForm />} />
                <Route path="/claim-form/:id/edit/:claimId" element={<ClaimForm />} />
                <Route path="/found-item-details/:id" element={<FoundItemDetails />} />
                <Route path="/found-item-details" element={<FoundItemDetails />} />
                <Route path="lost-item-details/:id" element={<LostItemDetails />} />
                <Route path="/claim-review/:id" element={<ClaimReview />} />
                <Route path="/lost-item-details" element={<LostItemDetails />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
