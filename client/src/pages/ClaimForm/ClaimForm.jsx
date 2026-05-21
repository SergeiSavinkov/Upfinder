import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import {
    fetchReportById,
    formatReportDate,
    getReportDescription,
    getReportImageUrl
} from "../../api/reports"
import "../../components/ReportCard/ReportCard.css"
import "./ClaimForm.css"

function ClaimForm() {
    const { id } = useParams()
    const { state } = useLocation()
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [item, setItem] = useState(state?.item || null)
    const [description, setDescription] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(!state?.item)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!id) return

        fetchReportById(id)
            .then(data => setItem(data))
            .catch(err => setMessage("Error: " + err.message))
            .finally(() => setLoading(false))
    }, [id])

    const submitClaim = async () => {
        setMessage("")

        if (!user?.id) {
            setMessage("Please log in before submitting a claim.")
            return
        }

        if (item?.user_id && Number(item.user_id) === Number(user.id)) {
            setMessage("You cannot claim your own report.")
            return
        }

        if (!description.trim()) {
            setMessage("Please describe why this item is yours.")
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch("http://localhost:5000/claims", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    item_report_id: item.id,
                    claimant_id: user.id,
                    description
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to create claim")
            }

            navigate("/dashboard")
        } catch (err) {
            setMessage("Error: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const imageUrl = getReportImageUrl(item || {})
    const isOwnReport = user?.id && item?.user_id && Number(user.id) === Number(item.user_id)

    return (
        <div className="claim-form-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="claim-form-main">
                {loading && <p className="claim-form-message">Loading item...</p>}

                {item && (
                    <section className="claim-form-layout">
                        <article className="item-card claim-item-card">
                            <div className="item-card-header">
                                <h3>{item.item_name}</h3>
                                <span className={`item-type ${item.report_type}`}>
                                    {item.report_type}
                                </span>
                            </div>

                            <div className="item-image">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={item.item_name} />
                                ) : (
                                    <span>No image</span>
                                )}
                            </div>

                            <div className="item-info">
                                <p>{getReportDescription(item)}</p>

                                <div className="item-meta">
                                    <span>{item.category_name || "No category"}</span>
                                    <span>{item.location_name || "No location"}</span>
                                    <span>{item.status || "open"}</span>
                                </div>

                                <div className="item-footnote">
                                    <small>Created {formatReportDate(item.created_at)}</small>
                                    <small>Reported by {item.email || "unknown user"}</small>
                                </div>
                            </div>
                        </article>

                        <section className="claim-input-panel">
                            <h2>Claim Input</h2>

                            <label>
                                Why do you think this item is yours?
                                <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe unique details, proof of ownership, or where you lost it" rows="8"/>
                            </label>

                            {message && <p className="claim-form-message">{message}</p>}
                            {isOwnReport && (
                                <p className="claim-own-report-warning">You can't claim a report you created.</p>
                            )}
                        </section>
                    </section>
                )}
            </main>

            <footer className="claim-form-footer">
                <button type="button" onClick={submitClaim} disabled={!item || submitting || isOwnReport}>
                    {submitting ? "Submitting..." : "Add Claim"}
                </button>
            </footer>
        </div>
    )
}

export default ClaimForm
