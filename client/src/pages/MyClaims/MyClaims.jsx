import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import { API_URL, formatReportDate } from "../../api/reports"
import "../Dashboard/Dashboard.css"
import "./MyClaims.css"

async function fetchUserClaims(userId) {
    const res = await fetch(`${API_URL}/claims/user/${userId}`)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to load claims")
    }

    return data
}

async function deleteClaim(id) {
    const res = await fetch(`${API_URL}/claims/${id}`, {
        method: "DELETE"
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to delete claim")
    }

    return data
}

function MyClaims() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadClaims() {
            if (!user?.id) {
                setError("Please log in to view your claims.")
                setLoading(false)
                return
            }

            try {
                const data = await fetchUserClaims(user.id)
                setClaims(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadClaims()
    }, [user?.id])

    const removeClaim = async claim => {
        try {
            await deleteClaim(claim.id)
            setClaims(prev => prev.filter(item => item.id !== claim.id))
        } catch (err) {
            setError(err.message)
        }
    }

    const editClaim = claim => {
        navigate(`/claim-form/${claim.item_report_id}/edit/${claim.id}`, {
            state: {
                item: {
                    ...claim,
                    id: claim.item_report_id
                },
                claim
            }
        })
    }

    return (
        <div className="dashboard-page my-claims-page">
            <div className="dashboard-header-wrap">
                <Header>
                    <NavigationButtons backTo="/dashboard" />
                </Header>
            </div>

            <main className="my-claims-main">
                <section className="my-claims-title">
                    <h2>Claim/-s Status</h2>
                    <span>{claims.length} claim{claims.length === 1 ? "" : "s"}</span>
                </section>

                {loading && <p className="dashboard-message">Loading claims...</p>}
                {error && <p className="dashboard-message error">{error}</p>}

                {!loading && !error && claims.length === 0 && (
                    <p className="dashboard-message">You do not have any claims yet.</p>
                )}

                {!loading && !error && claims.length > 0 && (
                    <div className="claims-list">
                        {claims.map((claim, index) => (
                            <article className="claim-status-card" key={claim.id}>
                                <div className="claim-status-marker">{index + 1}</div>

                                <div className="claim-status-content">
                                    <div className="claim-status-header">
                                        <h3>{claim.item_name || `Claim ${claim.id}`}</h3>

                                        <span className={`claim-status-badge ${claim.status || "pending"}`}>
                                            {claim.status || "pending"}
                                        </span>
                                    </div>

                                    <p>{claim.description || "No claim description provided."}</p>

                                    <div className="claim-status-meta">
                                        <span>{claim.report_type || "report"}</span>
                                        <span>Created {formatReportDate(claim.created_at)}</span>
                                    </div>

                                    <div className="claim-status-actions">
                                        <button className="edit-claim-button" type="button" onClick={() => editClaim(claim)}>
                                            Edit Claim
                                        </button>
                                        <button className="delete-claim-button" type="button" onClick={() => removeClaim(claim)}>
                                            Delete Claim
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

export default MyClaims
