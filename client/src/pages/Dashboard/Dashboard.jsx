import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import {
    fetchReports,
    getReportDescription
} from "../../api/reports"
import ReportCard from "../../components/ReportCard/ReportCard"
import ReportFilters from "../../components/ReportFilters/ReportFilters"
import "./Dashboard.css"

function normalize(value) {
    return String(value || "").toLowerCase().trim()
}

function getUniqueOptions(items, key) {
    return [...new Set(items.map(item => item[key]).filter(Boolean))]
}

function Dashboard() {
    const navigate = useNavigate()

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
                setReports(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadReports()
    }, [])

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

    const openDetails = item => {
        if (item.report_type === "found") {
            navigate(`/found-item-details/${item.id}`, {
                state: {item: item}
            })
        }

        if (item.report_type === "lost") {
            navigate(`/lost-item-details/${item.id}`, {
                state: {item: item}
            })
        }
    }

    const submitClaim = item => {
        console.log("Submit claim:", item)
    }

    const categories = getUniqueOptions(reports, "category_name")
    const locations = getUniqueOptions(reports, "location_name")

    return (
        <div className="dashboard-page">
            <div className="dashboard-header-wrap">
                <Header />

                <nav className="dashboard-header-nav" aria-label="Dashboard navigation">
                        <button className="nav-my-report" onClick={() => navigate("/my-reports")}>My Report</button>
                        <button className="nav-leaderboard">Leaderboard</button>
                        <button className="nav-profile" onClick={() => navigate("/profile")}>Profile</button>
                        <button className="nav-notifications">Notifications</button>
                        <button className="nav-logout" onClick={() => navigate("/login")}>Log Out</button>
                        <button className="nav-my-claims">My Claims</button>
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
                                    <h2>Reports</h2>
                                    <span>{filteredReports.length} items</span>
                                </div>

                                <div className="items-carousel">
                                    <div className="items-grid">
                                        {filteredReports.map(item => (
                                            <ReportCard key={item.id} item={item} onDetails={openDetails} onClaim={submitClaim} />
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

                <section className="dashboard-bottom">
                    <button className="chat-button">Chat</button>
                    <button className="add-report-button" onClick={() => navigate("/create-edit-report")}>Add Report</button>
                </section>
            </main>
        </div>
    )
}

export default Dashboard
