import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "../Dashboard/Dashboard.css"
import "./Notifications.css"

const API_URL = "http://localhost:5000"

function getTargetUrl(notification) {
    return notification.target_url || "/dashboard"
}

function formatNotificationDate(date) {
    if (!date) return "Unknown date"

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(date))
}

function Notifications() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!user?.id) {
            navigate("/login")
            return
        }

        async function loadNotifications() {
            try {
                const res = await fetch(`${API_URL}/notifications/user/${user.id}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load notifications")
                }

                setNotifications(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadNotifications()
    }, [user?.id, navigate])

    const openNotification = async notification => {
        try {
            const res = await fetch(`${API_URL}/notifications/${notification.id}`, {
                method: "DELETE"
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete notification")
            }

            setNotifications(prev =>
                prev.filter(item => item.id !== notification.id)
            )

            navigate(getTargetUrl(notification))
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="dashboard-page notifications-page">
            <div className="dashboard-header-wrap">
                <Header>
                    <NavigationButtons backTo="/dashboard" />
                </Header>
            </div>

            <main className="notifications-main">
                <section className="notifications-title">
                    <h2>Notifications</h2>
                    <span>{notifications.length} notification{notifications.length === 1 ? "" : "s"}</span>
                </section>

                {loading && <p className="dashboard-message">Loading notifications...</p>}
                {error && <p className="dashboard-message error">{error}</p>}

                {!loading && !error && notifications.length === 0 && (
                    <p className="dashboard-message">You do not have any notifications yet.</p>
                )}

                {!loading && !error && notifications.length > 0 && <div className="notifications-list">
                    {notifications.map((notification, index) => (
                        <article
                            key={notification.id}
                            className={`notification-row ${notification.is_read ? "read" : ""}`}
                        >
                            <div className="notification-marker">{index + 1}</div>

                            <div className="notification-content">
                                <div className="notification-header">
                                    <h3>{notification.title || "Notification"}</h3>
                                    <span>{formatNotificationDate(notification.created_at)}</span>
                                </div>

                                <p>{notification.text || "You have a new notification."}</p>

                                <div className="notification-actions">
                                    <button onClick={() => openNotification(notification)}>
                                        {notification.action || "Open"}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>}
            </main>
        </div>
    )
}

export default Notifications
