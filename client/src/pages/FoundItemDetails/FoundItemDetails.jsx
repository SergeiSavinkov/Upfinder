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
import "./FoundItemDetails.css"

const fallbackItem = {
    item_name: "Item 1",
    category_name: "Category",
    location_name: "Location",
    status: "open",
    description: "Description about the found item",
    email: "user@example.com",
    created_at: ""
}

function FoundItemDetails() {
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
        <div className="found-details-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="found-details-main">
                <div className="found-details-heading">
                    <div>
                        <span>Found item</span>
                        <h2>{item.item_name}</h2>
                    </div>

                    <span className="found-status">{item.status || "open"}</span>
                </div>

                <section className="found-details-card">
                    <div className="found-item-image">
                        {imageUrl ? (
                            <img src={imageUrl} alt={item.item_name} />
                        ) : (
                            <span>No image</span>
                        )}
                    </div>

                    <div className="found-item-info">
                        <h3>Item information</h3>

                        <div className="found-info-list">
                            <p><b>Category:</b> {item.category_name || "No category"}</p>
                            <p><b>Date:</b> {formatReportDate(item.created_at)}</p>
                            <p><b>Type:</b> {item.report_type || "found"}</p>
                            <p><b>Reported by:</b> {item.email || "unknown user"}</p>
                        </div>

                        <div className="found-location-box">
                            <span>Found at</span>
                            <strong>{item.location_name || "No location"}</strong>
                            {locationDetails && <p>{locationDetails}</p>}
                            {locationDescription && <p>{locationDescription}</p>}
                        </div>
                    </div>
                </section>

                <section className="found-description-card">
                    <h3>Description</h3>
                    <p>{description}</p>
                </section>

                <div className="found-details-actions">
                    <button className="found-primary-action">Claim</button>
                    <button className="found-secondary-action">Message</button>
                    <button className="found-secondary-action">Check Matches</button>
                </div>
            </main>
        </div>
    )
}

export default FoundItemDetails
