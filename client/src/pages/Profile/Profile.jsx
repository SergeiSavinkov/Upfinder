import { useState } from "react"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "./Profile.css"

const API_URL = "http://localhost:5000"

function Profile() {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null")

    const [form, setForm] = useState({
        first_name: savedUser?.first_name || "",
        last_name: savedUser?.last_name || "",
        email: savedUser?.email || "",
        role: savedUser?.role || "student",
        password: ""
    })

    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleChange = ({ target: { name, value } }) => {
        setForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const saveProfile = async () => {
        setMessage("")

        if (!savedUser?.id) {
            setMessage("Error: user is not logged in.")
            return
        }

        if (!form.first_name || !form.last_name || !form.email) {
            setMessage("Please fill in all required fields.")
            return
        }

        setSubmitting(true)

        try {
            const body = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                role: form.role
            }

            if (form.password) {
                body.password = form.password
            }

            const res = await fetch(`${API_URL}/auth/users/${savedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            const updatedUser = await res.json()

            if (!res.ok) {
                throw new Error(updatedUser.error || "Failed to update profile")
            }

            localStorage.setItem("user", JSON.stringify(updatedUser))
            setMessage("Profile updated successfully.")
        } catch (err) {
            setMessage("Error: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="profile-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="profile-main">
                <section className="profile-form">
                    <h2>Edit Profile</h2>

                    <label>
                        First name
                        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name"/>
                    </label>

                    <label>
                        Last name
                        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name"/>
                    </label>

                    <label>
                        Email
                        <input name="email" value={form.email} onChange={handleChange} placeholder="Email"/>
                    </label>

                    <label>
                        Role
                        <select name="role" value={form.role} onChange={handleChange}>
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </label>

                    <label>
                        New password
                        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave empty to keep current password"/>
                    </label>

                    {message && <p className="profile-message">{message}</p>}
                </section>
            </main>

            <footer className="profile-footer">
                <button className="profile-primary-button" type="button" onClick={saveProfile} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
            </footer>
        </div>
    )
}

export default Profile
