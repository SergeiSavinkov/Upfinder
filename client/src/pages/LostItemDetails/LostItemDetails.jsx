import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import {
    fetchReportById,
    formatReportDate,
    getLocationDescription,
    getLocationDetails,
    getReportDescription,
    getReportImageUrl
} from "../../api/reports"
import "./LostItemDetails.css"

const fallbackItem = {
    item_name: "Item 2",
    category_name: "Category",
    location_name: "Location",
    status: "open",
    description: "Description about the lost item",
    email: "user@example.com",
    created_at: ""
}

function LostItemDetails() {
    const { id } = useParams()
    const { state } = useLocation()

    const [item, setItem] = useState(state?.item || fallbackItem)

    useEffect(() => {
        const reportId = id || state?.item?.id

        if (!reportId) return

        fetchReportById(reportId)
            .then(data => {
                if (data) setItem(data)
            })
            .catch(err => {
                console.log("Failed to load item details:", err)
            })
    }, [id, state?.item?.id])

    const imageUrl = getReportImageUrl(item)
    const description = getReportDescription(item)
    const locationDetails = getLocationDetails(item)
    const locationDescription = getLocationDescription(item)

    return (
        <div className="lost-details-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="lost-details-main">
                <div className="lost-details-heading">
                    <div>
                        <span>Lost item</span>
                        <h2>{item.item_name}</h2>
                    </div>

                    <span className="lost-status">{item.status || "open"}</span>
                </div>

                <section className="lost-details-card">
                    <div className="lost-item-image">
                        {imageUrl ? (
                            <img src={imageUrl} alt={item.item_name} />
                        ) : (
                            <span>No image</span>
                        )}
                    </div>

                    <div className="lost-item-info">
                        <h3>Item information</h3>

                        <div className="lost-info-list">
                            <p><b>Category:</b> {item.category_name || "No category"}</p>
                            <p><b>Date:</b> {formatReportDate(item.created_at)}</p>
                            <p><b>Type:</b> {item.report_type || "lost"}</p>
                            <p><b>Reported by:</b> {item.email || "unknown user"}</p>
                        </div>

                        <div className="lost-location-box">
                            <span>Lost at</span>
                            <strong>{item.location_name || "No location"}</strong>
                            {locationDetails && <p>{locationDetails}</p>}
                            {locationDescription && <p>{locationDescription}</p>}
                        </div>
                    </div>
                </section>

                <section className="lost-description-card">
                    <h3>Description</h3>
                    <p>{description}</p>
                </section>

                <div className="lost-details-actions">
                    <button className="lost-primary-action">Message</button>
                    <button className="lost-secondary-action">Check Matches</button>
                </div>
            </main>
        </div>
    )
}

export default LostItemDetails
