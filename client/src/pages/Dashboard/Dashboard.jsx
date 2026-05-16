import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import {
    fetchReports,
    formatReportDate,
    getReportDescription,
    getReportImageUrl
} from "../../api/reports"
import "./Dashboard.css"

function normalize(value) {
    return String(value || "").toLowerCase().trim()
}

function getUniqueOptions(items, key) {
    return [...new Set(items.map(item => item[key]).filter(Boolean))]
}

function ItemCard({ item, onDetails, onClaim }) {
    const isFound = item.report_type === "found"
    const imageUrl = getReportImageUrl(item)

    return (
        <article className="item-card">
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
                <button onClick={() => onDetails(item)}>Item Details</button>

                {isFound && (
                    <button className="secondary-action" onClick={() => onClaim(item)}>Claim</button>
                )}
            </div>
        </article>
    )
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
                        <button className="nav-my-report">My Report</button>
                        <button className="nav-leaderboard">Leaderboard</button>
                        <button className="nav-profile">Profile</button>
                        <button className="nav-notifications">Notifications</button>
                        <button className="nav-logout" onClick={() => navigate("/login")}>Log Out</button>
                        <button className="nav-my-claims">My Claims</button>
                </nav>
            </div>

            <main className="dashboard-main">
                <section className="dashboard-content">
                    <aside className="filters-panel">
                        <div className="filters-title">Filters</div>

                        <label>
                            Search
                            <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Name, description, category..."/>
                        </label>

                        <label>
                            Report type
                            <select name="reportType" value={filters.reportType} onChange={handleFilterChange}>
                                <option value="all">All</option>
                                <option value="lost">Lost</option>
                                <option value="found">Found</option>
                            </select>
                        </label>

                        <label>
                            Category
                            <select name="category" value={filters.category} onChange={handleFilterChange}>
                                <option value="all">All</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Location
                            <select name="location" value={filters.location} onChange={handleFilterChange}>
                                <option value="all">All</option>
                                {locations.map(location => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            From
                            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
                        </label>

                        <label>
                            To
                            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
                        </label>

                        <label>
                            Sort
                            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </label>

                        <button className="clear-filters" onClick={clearFilters}>
                            Clear filters
                        </button>
                    </aside>

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
                                            <ItemCard
                                                key={item.id}
                                                item={item}
                                                onDetails={openDetails}
                                                onClaim={submitClaim}
                                            />
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