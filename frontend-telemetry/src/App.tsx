import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UserProfile from './pages/UserProfile'
import Investigation from './pages/Investigation'
import AuditLog from './pages/AuditLog'

function AppRoutes() {
    const { state } = useApp()

    if (!state.currentUser) {
        return <LoginPage />
    }

    return (
        <div className="flex h-screen bg-primary text-primary">
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:username" element={<UserProfile />} />
                <Route path="/investigation" element={<Investigation />} />
                <Route path="/audit" element={<AuditLog />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    )
}

export default function App() {
    return (
        <Router>
            <AppProvider>
                <AppRoutes />
            </AppProvider>
        </Router>
    )
}
