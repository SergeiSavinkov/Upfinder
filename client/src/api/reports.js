export const API_URL = "http://localhost:5000"

function bufferToImageUrl(image) {
    if (!image?.data?.length) {
        return ""
    }

    let binary = ""
    const bytes = new Uint8Array(image.data)

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte)
    })

    return `data:image/png;base64,${btoa(binary)}`
}

export function getReportImageUrl(report) {
    if (report.image_url) {
        return report.image_url
    }

    if (report.has_image) {
        return `${API_URL}/reports/${report.id}/image`
    }

    return bufferToImageUrl(report.image)
}

export function getReportDescription(report) {
    return report.description || report.item_description || "No description provided."
}

export function getLocationDetails(report) {
    return [
        report.location_floor && `Floor ${report.location_floor}`,
        report.location_room && `Room ${report.location_room}`
    ].filter(Boolean).join(", ")
}

export function getLocationDescription(report) {
    return report.location_description || report.location_details || report.address || ""
}

export function formatReportDate(date) {
    if (!date) {
        return "Unknown date"
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(date))
}

export async function fetchReports() {
    const res = await fetch(`${API_URL}/reports`)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to load reports")
    }

    return data
}

export async function fetchReportById(id) {
    const res = await fetch(`${API_URL}/reports/${id}`)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to load report")
    }

    return data
}

export async function createReport(form, userId, imageFile) {
    const body = new FormData()

    body.append("user_id", userId)
    body.append("item_name", form.item_name)
    body.append("item_description", form.item_description)
    body.append("report_type", form.report_type)
    body.append("category_name", form.category_name)
    body.append("location_name", form.location_name)
    body.append("location_floor", form.location_floor)
    body.append("location_room", form.location_room)
    body.append("location_description", form.location_description)
    body.append("status", form.status)

    if (imageFile) {
        body.append("image", imageFile)
    }

    const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        body
    })
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to create report")
    }

    return data
}

export async function deleteReport(id) {
    const res = await fetch(`${API_URL}/reports/${id}`, {
        method: "DELETE"
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to delete report")
    }

    return data
}