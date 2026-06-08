import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "../Dashboard/Dashboard.css"
import "./ClaimReview.css"
import { API_URL } from "../../config";

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

async function fetchReportById(reportId) {
    const res = await fetch(`${API_URL}/reports/${reportId}`)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to load report")
    }

    return data
}

async function fetchReportClaims(reportId) {
    const res = await fetch(`${API_URL}/claims/report/${reportId}`)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to load claims")
    }

    return data
}

async function updateClaimStatus(claimId, status) {
    const res = await fetch(`${API_URL}/claims/${claimId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to update claim status")
    }

    return data
}

function ClaimReview() {
    const { id } = useParams()
    const { state } = useLocation()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [item, setItem] = useState(state?.item || null)
    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadReview() {
            try {
                const [reportData, claimsData] = await Promise.all([
                    state?.item ? Promise.resolve(state.item) : fetchReportById(id),
                    fetchReportClaims(id)
                ])

                setItem(reportData)
                setClaims(claimsData)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadReview()
    }, [id, state?.item])

    const changeStatus = async (claim, status) => {
        try {
            await updateClaimStatus(claim.id, status)

            setClaims(prev => prev.map(item => {
                if (item.id !== claim.id) {
                    return item
                }

                return { ...item, status }
            }))
        } catch (err) {
            setError(err.message)
        }
    }

    const isOwner = item?.user_id && user?.id && Number(item.user_id) === Number(user.id)
    const hasApprovedClaim = claims.some(
        claim => claim.status === "approved"
    )

    return (
        <div className="dashboard-page claim-review-page">
            <div className="dashboard-header-wrap">
                <Header>
                    <NavigationButtons backTo="/my-reports" />
                </Header>
            </div>

            <main className="claim-review-main">
                <section className="claim-review-title">
                    <div>
                        <h2>Claim/-s Review</h2>
                        {item && <p>{item.item_name}</p>}
                    </div>

                    <span>{claims.length} claim{claims.length === 1 ? "" : "s"}</span>
                </section>

                {loading && <p className="dashboard-message">Loading claims...</p>}
                {error && <p className="dashboard-message error">{error}</p>}

                {!loading && item?.report_type !== "found" && (
                    <p className="dashboard-message error">
                        Claim review is available only for found items.
                    </p>
                )}

                {!loading && !isOwner && (
                    <p className="dashboard-message error">
                        You can review claims only for your own reports.
                    </p>
                )}

                {!loading && !error && claims.length === 0 && (
                    <p className="dashboard-message">No claims for this report yet.</p>
                )}

                {!loading && !error && isOwner && item?.report_type === "found" && claims.length > 0 && (
                    <div className="claim-review-list">
                        {claims.map((claim, index) => (
                            <article className="claim-review-card" key={claim.id}>
                                <div className="claim-review-number">{index + 1}</div>

                                <div className="claim-review-content">
                                    <div className="claim-review-card-header">
                                        <h3>Claim {index + 1}</h3>
                                        <span className={`claim-review-status ${claim.status || "pending"}`}>
                                            {claim.status || "pending"}
                                        </span>
                                    </div>

                                    <p>{claim.description || "No claim description provided."}</p>

                                    <div className="claim-review-meta">
                                        <span>{claim.claimant_email || "Unknown claimant"}</span>
                                        <span>Created {formatReportDate(claim.created_at)}</span>
                                    </div>

                                    <div className="claim-review-actions">
                                        <button type="button" className="approve-claim-button"
                                            disabled={
                                                claim.status === "approved" ||
                                                (hasApprovedClaim && claim.status !== "approved")
                                            }
                                            onClick={() => changeStatus(claim, "approved")}
                                        >
                                            Approve
                                        </button>

                                        <button type="button" className="reject-claim-button" disabled={claim.status === "rejected"} onClick={() => changeStatus(claim, "rejected")}>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default ClaimReview
