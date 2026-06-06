import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom"
import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import ItemDetails from "./pages/ItemDetails/ItemDetails"
import CreateEditReport from "./pages/CreateEditReport/CreateEditReport"
import MyReports from "./pages/MyReports/MyReports"
import Profile from "./pages/Profile/Profile"
import ClaimForm from "./pages/ClaimForm/ClaimForm"
import MyClaims from "./pages/MyClaims/MyClaims"
import ClaimReview from "./pages/ClaimReview/ClaimReview"
import Chat from "./pages/Chat/Chat"
import MatchResults from "./pages/MatchResults/MatchResults"
import MatchDetails from "./pages/MatchDetails/MatchDetails"
import Notifications from "./pages/Notifications/Notifications"

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
                <Route path="/item-details/:id" element={<ItemDetails />} />
                <Route path="/found-item-details/:id" element={<ItemDetails />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/lost-item-details/:id" element={<ItemDetails />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/claim-review/:id" element={<ClaimReview />} />
                <Route path="/match-results/:id" element={<MatchResults />} />
                <Route path="/match-details/:id" element={<MatchDetails />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
