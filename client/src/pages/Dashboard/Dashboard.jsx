import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import ReportCard from "../../components/ReportCard/ReportCard"
import ReportFilters from "../../components/ReportFilters/ReportFilters"
import "./Dashboard.css"

const API_URL = "http://localhost:5000"

function normalize(value) {
    return String(value || "").toLowerCase().trim()
}

function getUniqueOptions(items, key) {
    return [...new Set(items.map(item => item[key]).filter(Boolean))]
}

function getReportDescription(report) {
    return report.description || report.item_description || "No description provided."
}

function Dashboard() {
    const navigate = useNavigate()

    const [reports, setReports] = useState([])
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
                const res = await fetch(`${API_URL}/reports`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load reports")
                }

                setReports(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadReports()
    }, [])

    let filteredReports = [...reports]

    const search = normalize(filters.search)

    if (search) {
        filteredReports = filteredReports.filter(item => {
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
        filteredReports = filteredReports.filter(item => item.report_type === filters.reportType)
    }

    if (filters.category !== "all") {
        filteredReports = filteredReports.filter(item => item.category_name === filters.category)
    }

    if (filters.location !== "all") {
        filteredReports = filteredReports.filter(item => item.location_name === filters.location)
    }

    if (filters.dateFrom) {
        filteredReports = filteredReports.filter(item => {
            return new Date(item.created_at) >= new Date(filters.dateFrom)
        })
    }

    if (filters.dateTo) {
        filteredReports = filteredReports.filter(item => {
            return new Date(item.created_at) <= new Date(filters.dateTo)
        })
    }

    filteredReports.sort((a, b) => {
        const dateA = new Date(a.created_at)
        const dateB = new Date(b.created_at)

        return filters.sort === "oldest" ? dateA - dateB : dateB - dateA
    })

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
        navigate(`/item-details/${item.id}`, {
            state: { item }
        })
    }

    const categories = getUniqueOptions(reports, "category_name")
    const locations = getUniqueOptions(reports, "location_name")

    return (
        <div className="dashboard-page">
            <div className="dashboard-header-wrap">
                <Header />

                <nav className="dashboard-header-nav" aria-label="Dashboard navigation">
                    <button className="nav-my-report" onClick={() => navigate("/my-reports")}>My Report</button>
                    <button className="nav-profile" onClick={() => navigate("/profile")}>Profile</button>
                    <button className="nav-notifications">Notifications</button>
                    <button className="nav-logout" onClick={() => navigate("/login")}>Log Out</button>
                    <button className="nav-my-claims" onClick={() => navigate("/my-claims")}>My Claims</button>
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
                                            <ReportCard key={item.id} item={item} onDetails={openDetails} />
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
                    <button className="chat-button" onClick={() => navigate("/chat")}>Chat</button>
                    <button className="add-report-button" onClick={() => navigate("/create-edit-report")}>Add Report</button>
                </section>
            </main>
        </div>
    )
}

export default Dashboard
