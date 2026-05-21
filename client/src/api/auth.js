import { API_URL } from "./reports"

export async function updateUserProfile(userId, form) {
    const body = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role
    }

    if (form.password) {
        body.password = form.password
    }

    const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
    }

    return data
}