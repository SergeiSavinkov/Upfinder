import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "./MatchResults.css"

const API_URL = "http://localhost:5000"

function MatchResults() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadMatches() {
            try {
                const res = await fetch(`${API_URL}/matches/report/${id}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load matches")
                }

                setMatches(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadMatches()
    }, [id])

    return (
        <div className="match-results-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="match-results-main">
                <h2>Match Results</h2>

                {loading && <p className="match-message">Loading matches...</p>}
                {error && <p className="match-message error">{error}</p>}

                {!loading && !error && matches.length === 0 && (
                    <p className="match-message">No potential matches found.</p>
                )}

                {!loading && !error && matches.length > 0 && (
                    <div className="match-list">
                        {matches.map((match, index) => (
                            <article className="match-row" key={match.match_id}>
                                <div className="match-number">{index + 1}</div>

                                <div className="match-info">
                                    <strong>Potential Match {index + 1}</strong>
                                    <span>{match.report.item_name}</span>
                                    <small>{match.similarity_score}% match</small>
                                </div>

                                <button type="button" onClick={() => navigate(`/match-details/${match.match_id}`)}>
                                    Details
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default MatchResults
