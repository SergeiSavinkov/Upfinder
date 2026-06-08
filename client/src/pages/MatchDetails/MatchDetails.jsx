import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "./MatchDetails.css"
import { API_URL } from "../../config"

function getImageUrl(report) {
    return report?.has_image ? `${API_URL}/reports/${report.id}/image` : ""
}

function ReportPreview({ report, title }) {
    const imageUrl = getImageUrl(report)

    return (
        <article className="match-detail-card">
            <div className="match-detail-card-title">{title}</div>

            <div className="match-detail-image">
                {imageUrl ? (
                    <img src={imageUrl} alt={report.item_name} />
                ) : (
                    <span>No image</span>
                )}
            </div>

            <h3>{report.item_name}</h3>
            <p>{report.item_description || "No description provided."}</p>

            <div className="match-detail-meta">
                <span>{report.category_name || "No category"}</span>
                <span>{report.location_name || "No location"}</span>
                <span>{report.email || "unknown user"}</span>
            </div>
        </article>
    )
}

function MatchDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [match, setMatch] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadMatch() {
            try {
                const res = await fetch(`${API_URL}/matches/${id}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load match")
                }

                setMatch(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadMatch()
    }, [id])

    if (loading) {
        return (
            <div className="match-details-page">
                <Header><NavigationButtons /></Header>
                <main className="match-details-main">
                    <p className="match-message">Loading match...</p>
                </main>
            </div>
        )
    }

    if (error || !match) {
        return (
            <div className="match-details-page">
                <Header><NavigationButtons /></Header>
                <main className="match-details-main">
                    <p className="match-message error">{error || "Match not found"}</p>
                </main>
            </div>
        )
    }

    const ownsLostReport = Number(user?.id) === Number(match.lost_report.user_id)
    const contactReport = ownsLostReport ? match.found_report : match.lost_report

    const openChat = () => {
        navigate("/chat", {
            state: {
                contact: {
                    user_id: contactReport.user_id,
                    email: contactReport.email,
                    item_report_id: contactReport.id,
                    item_name: contactReport.item_name,
                    report_type: contactReport.report_type
                }
            }
        })
    }

    return (
        <div className="match-details-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="match-details-main">
                <div className="match-details-heading">
                    <h2>Match Details</h2>
                    <span>{match.similarity_score}% match</span>
                </div>

                <section className="match-detail-grid">
                    <ReportPreview report={match.lost_report} title="Lost Item" />
                    <ReportPreview report={match.found_report} title="Found Item" />
                </section>

                <footer className="match-detail-actions">
                    {contactReport.report_type === "found" ? (
                        <button
                            type="button"
                            onClick={() => navigate(`/claim-form/${contactReport.id}`, {
                                state: { item: contactReport }
                            })}
                        >
                            Add Claim
                        </button>
                    ) : (
                        <button type="button" onClick={openChat}>
                            Message
                        </button>
                    )}
                </footer>
            </main>
        </div>
    )
}

export default MatchDetails
