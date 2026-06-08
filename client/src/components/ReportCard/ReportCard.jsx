import "./ReportCard.css"
import { API_URL } from "../../config";

function getReportImageUrl(report) {
    return report.has_image ? `${API_URL}/reports/${report.id}/image` : ""
}

function getReportDescription(report) {
    return report.description || report.item_description || "No description provided."
}

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

function ReportCard({ item, onDetails }) {
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
            </div>
        </article>
    )
}

export default ReportCard
