import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import ReportFilters from "../../components/ReportFilters/ReportFilters"
import {
    deleteReport as removeReport,
    fetchReports,
    formatReportDate,
    getReportDescription,
    getReportImageUrl
} from "../../api/reports"
import "../Dashboard/Dashboard.css"
import "../../components/ReportCard/ReportCard.css"
import "./MyReports.css"

function normalize(value) {
    return String(value || "").toLowerCase().trim()
}

function getUniqueOptions(items, key) {
    return [...new Set(items.map(item => item[key]).filter(Boolean))]
}

function MyReportCard({ item, onEdit, onReview, onDelete }) {
    const imageUrl = getReportImageUrl(item)

    return (
        <article className="item-card my-report-card">
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

            <div className="item-actions">
                <button onClick={() => onEdit(item)}>Edit Report</button>
                <button className="secondary-action" onClick={() => onReview(item)}>Claim / -s Review</button>
                <button className="danger-action" onClick={() => onDelete(item)}>Delete</button>
            </div>
        </article>
    )
}

function MyReports() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [reports, setReports] = useState([])
    const [filteredReports, setFilteredReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [filters, setFilters] = useState({
        search: "",
        reportType: "all",
        category: "all",
        location: "all",
        dateFrom: "",
        dateTo: "",
        sort: "newest"
    })

    useEffect(() => {
        async function loadReports() {
            try {
                const data = await fetchReports()
                setReports(data.filter(item => item.user_id === user?.id))
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadReports()
    }, [user?.id])

    useEffect(() => {
        let result = [...reports]

        const search = normalize(filters.search)

        if (search) {
            result = result.filter(item => {
                const name = normalize(item.item_name)
                const description = normalize(getReportDescription(item))
                const category = normalize(item.category_name)
                const location = normalize(item.location_name)

                return (
                    name.includes(search) ||
                    description.includes(search) ||
                    category.includes(search) ||
                    location.includes(search)
                )
            })
        }

        if (filters.reportType !== "all") {
            result = result.filter(item => item.report_type === filters.reportType)
        }

        if (filters.category !== "all") {
            result = result.filter(item => item.category_name === filters.category)
        }

        if (filters.location !== "all") {
            result = result.filter(item => item.location_name === filters.location)
        }

        if (filters.dateFrom) {
            result = result.filter(item => {
                return new Date(item.created_at) >= new Date(filters.dateFrom)
            })
        }

        if (filters.dateTo) {
            result = result.filter(item => {
                return new Date(item.created_at) <= new Date(filters.dateTo)
            })
        }

        result.sort((a, b) => {
            const dateA = new Date(a.created_at)
            const dateB = new Date(b.created_at)

            return filters.sort === "oldest" ? dateA - dateB : dateB - dateA
        })

        setFilteredReports(result)
    }, [reports, filters])

    const handleFilterChange = ({ target: { name, value } }) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const clearFilters = () => {
        setFilters({
            search: "",
            reportType: "all",
            category: "all",
            location: "all",
            dateFrom: "",
            dateTo: "",
            sort: "newest"
        })
    }

    const editReport = item => {
        navigate(`/create-edit-report/${item.id}`)
    }

    const reviewClaim = item => {
        console.log("Claim / -s Review:", item)
    }

    const deleteReport = async item => {
        try {
            await removeReport(item.id)
            setReports(prev => prev.filter(report => report.id !== item.id))
        } catch (err) {
            setError(err.message)
        }
    }

    const categories = getUniqueOptions(reports, "category_name")
    const locations = getUniqueOptions(reports, "location_name")

    return (
        <div className="dashboard-page my-reports-page">
            <div className="dashboard-header-wrap">
                <Header />

                <nav className="my-reports-header-nav" aria-label="My reports navigation">
                    <button type="button">Chat</button>
                    <button type="button" onClick={() => navigate("/dashboard")}>Back</button>
                    <button type="button" onClick={() => navigate("/login")}>Log Out</button>
                </nav>
            </div>

            <main className="dashboard-main">
                <section className="dashboard-content">
                    <ReportFilters filters={filters} categories={categories} locations={locations} onChange={handleFilterChange} onClear={clearFilters} />

                    <section className="items-section">
                        {loading && <p className="dashboard-message">Loading reports...</p>}
                        {error && <p className="dashboard-message error">{error}</p>}

                        {!loading && !error && (
                            <>
                                <div className="items-header">
                                    <h2>My Reports</h2>
                                    <span>{filteredReports.length} items</span>
                                </div>

                                <div className="items-carousel">
                                    <div className="items-grid">
                                        {filteredReports.map(item => (
                                            <MyReportCard key={item.id} item={item} onEdit={editReport} onReview={reviewClaim} onDelete={deleteReport} />
                                        ))}
                                    </div>
                                </div>

                                {filteredReports.length === 0 && (
                                    <p className="dashboard-message">No reports match selected filters.</p>
                                )}
                            </>
                        )}
                    </section>
                </section>
            </main>
        </div>
    )
}

export default MyReports
