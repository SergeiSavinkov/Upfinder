import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "./ItemDetails.css"

const API_URL = "http://localhost:5000"

function getReportImageUrl(report) {
    return report.has_image ? `${API_URL}/reports/${report.id}/image` : ""
}

function getReportDescription(report) {
    return report.description || report.item_description || "No description provided."
}

function formatReportDate(date) {
    if (!date) {
        return "Unknown date"
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(date))
}

const emptyItem = {
    item_name: "Item",
    category_name: "",
    location_name: "",
    status: "open",
    item_description: "",
    email: "",
    created_at: ""
}

function ItemDetails() {
    const { id } = useParams()
    const { state } = useLocation()
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [item, setItem] = useState(state?.item || emptyItem)

    useEffect(() => {
        const reportId = id || state?.item?.id

        if (!reportId) return

        async function loadReport() {
            try {
                const res = await fetch(`${API_URL}/reports/${reportId}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load report")
                }

                setItem(data)
            } catch (err) {
                console.log("Failed to load item details:", err)
            }
        }

        loadReport()
    }, [id, state?.item?.id])

    const isFound = item.report_type === "found"
    const isOwnReport = user?.id && item.user_id && Number(user.id) === Number(item.user_id)
    const imageUrl = getReportImageUrl(item)
    const description = getReportDescription(item)

    const openChat = () => {
        if (isOwnReport) return

        navigate("/chat", {
            state: {
                contact: {
                    user_id: item.user_id,
                    first_name: item.first_name,
                    last_name: item.last_name,
                    email: item.email,
                    item_report_id: item.id,
                    item_name: item.item_name,
                    report_type: item.report_type
                }
            }
        })
    }

    return (
        <div className="item-details-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="item-details-main">
                <div className="item-details-heading">
                    <div>
                        <span>{isFound ? "Found item" : "Lost item"}</span>
                        <h2>{item.item_name}</h2>
                    </div>

                    <span className="item-status">{item.status || "open"}</span>
                </div>

                <section className="item-details-card">
                    <div className="item-details-image">
                        {imageUrl ? (
                            <img src={imageUrl} alt={item.item_name} />
                        ) : (
                            <span>No image</span>
                        )}
                    </div>

                    <div className="item-details-info">
                        <h3>Item information</h3>

                        <div className="item-info-list">
                            <p><b>Category:</b> {item.category_name || "No category"}</p>
                            <p><b>Date:</b> {formatReportDate(item.created_at)}</p>
                            <p><b>Type:</b> {item.report_type || "report"}</p>
                            <p><b>Reported by:</b> {item.email || "unknown user"}</p>
                        </div>

                        <div className="item-location-box">
                            <span>{isFound ? "Found at" : "Lost at"}</span>
                            <strong>{item.location_name || "No location"}</strong>
                        </div>
                    </div>
                </section>

                <section className="item-description-card">
                    <h3>Description</h3>
                    <p>{description}</p>
                </section>

                <div className="item-details-actions">
                    {isFound && (
                        <button
                            className="item-primary-action"
                            disabled={isOwnReport}
                            onClick={() => navigate(`/claim-form/${item.id}`, {
                                state: { item }
                            })}
                        >
                            Claim
                        </button>
                    )}

                    <button className={isFound ? "item-secondary-action" : "item-primary-action"} onClick={openChat} disabled={isOwnReport}>
                        {isOwnReport ? "Your Report" : "Message"}
                    </button>
                    <button className="item-secondary-action" onClick={() => navigate(`/match-results/${item.id}`)}>
                        Check Matches
                    </button>
                </div>

                {isOwnReport && (
                    <p className="item-details-warning">
                        {isFound ? "You can't claim or message a report you created." : "You can't message a report you created."}
                    </p>
                )}
            </main>
        </div>
    )
}

export default ItemDetails
