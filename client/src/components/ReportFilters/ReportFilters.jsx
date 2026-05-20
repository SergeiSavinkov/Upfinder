import "./ReportFilters.css"

function ReportFilters({
    filters,
    categories,
    locations,
    onChange,
    onClear
}) {
    return (
        <aside className="filters-panel">
            <div className="filters-title">Filters</div>

            <label>
                Search
                <input name="search" value={filters.search} onChange={onChange} placeholder="Name, description, category..."/>
            </label>

            <label>
                Report type
                <select name="reportType" value={filters.reportType} onChange={onChange}>
                    <option value="all">All</option>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                </select>
            </label>

            <label>
                Category
                <select name="category" value={filters.category} onChange={onChange}>
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
                <select name="location" value={filters.location} onChange={onChange}>
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
                <input type="date" name="dateFrom" value={filters.dateFrom} onChange={onChange} />
            </label>

            <label>
                To
                <input type="date" name="dateTo" value={filters.dateTo} onChange={onChange} />
            </label>

            <label>
                Sort
                <select name="sort" value={filters.sort} onChange={onChange}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                </select>
            </label>

            <button className="clear-filters" onClick={onClear}>
                Clear filters
            </button>
        </aside>
    )
}

export default ReportFilters
