import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import { createReport, fetchReportById, getReportImageUrl } from "../../api/reports"
import "./CreateEditReport.css"

function CreateEditReport() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = Boolean(id)

    const user = JSON.parse(localStorage.getItem("user") || "null")

    const [form, setForm] = useState({
        item_name: "",
        item_description: "",
        report_type: "lost",
        category_name: "",
        location_name: "",
        location_floor: "",
        location_room: "",
        location_description: "",
        status: "open"
    })

    const [message, setMessage] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState("")
    const [loading, setLoading] = useState(isEditMode)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!isEditMode) return

        async function fetchReport() {
            try {
                const data = await fetchReportById(id)

                setForm({
                    item_name: data.item_name || "",
                    item_description: data.item_description || data.description || "",
                    report_type: data.report_type || "lost",
                    category_name: data.category_name || "",
                    location_name: data.location_name || "",
                    location_floor: data.location_floor || "",
                    location_room: data.location_room || "",
                    location_description: data.location_description || "",
                    status: data.status || "open"
                })
                setImagePreview(getReportImageUrl(data))
            } catch (err) {
                setMessage("Error: " + err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchReport()
    }, [id, isEditMode])

    const handleChange = ({ target: { name, value } }) => {
        setForm(prev => ({
            ...prev, [name]: value
        }))
    }

    const handleImageChange = ({ target: { files } }) => {
        const file = files?.[0]

        if (!file) {
            setImageFile(null)
            setImagePreview("")
            return
        }

        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const submitReport = async () => {
        setMessage("")

        if (!form.item_name || !form.item_description || !form.category_name || !form.location_name) {
            setMessage("Please fill in all required fields.")
            return
        }

        setSubmitting(true)

        try {
            await createReport(form, user?.id, imageFile)
            navigate("/dashboard")
        } catch (err) {
            setMessage("Error: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="create-report-page">
            <Header>
                <NavigationButtons />
            </Header>

            <main className="create-report-main">
                <section className="create-report-form">
                    <h2>{isEditMode ? "Edit Report" : "Create Report"}</h2>
                    {loading && <p className="create-report-note">Loading report...</p>}

                    <div className="create-report-layout">
                        <div className="create-report-column">
                            <label>
                                Report name
                                <input name="item_name" value={form.item_name} onChange={handleChange} placeholder="Item name" />
                            </label>

                            <label>
                                Report type
                                <select name="report_type" value={form.report_type} onChange={handleChange}>
                                    <option value="lost">Lost</option>
                                    <option value="found">Found</option>
                                </select>
                            </label>

                            <label>
                                Category
                                <input name="category_name" value={form.category_name} onChange={handleChange} placeholder="Category" />
                            </label>

                            <label>
                                Location
                                <input name="location_name" value={form.location_name} onChange={handleChange} placeholder="Location" />
                            </label>

                            <div className="create-report-field-row">
                                <label>
                                    Floor
                                    <input name="location_floor" value={form.location_floor} onChange={handleChange} placeholder="Floor" />
                                </label>

                                <label>
                                    Room
                                    <input name="location_room" value={form.location_room} onChange={handleChange} placeholder="Room" />
                                </label>
                            </div>

                            <label>
                                Location details
                                <textarea name="location_description" value={form.location_description} onChange={handleChange} placeholder="Add a more detailed location description" rows="4" />
                            </label>
                        </div>

                        <div className="create-report-column create-report-media-column">
                            <label>
                                Image
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                            </label>

                            <div className="create-report-image-preview">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Selected item preview" />
                                ) : (
                                    <span>No image selected</span>
                                )}
                            </div>

                            <label>
                                Description
                                <textarea name="item_description" value={form.item_description} onChange={handleChange} placeholder="Describe the item" rows="5" />
                            </label>

                            <label>
                                Status
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="open">Open</option>
                                    <option value="matched">Matched</option>
                                    <option value="returned">Returned</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {message && <p className="create-report-message">{message}</p>}
                </section>
            </main>

            <footer className="create-report-footer">
                <button
                    className="create-report-primary-button"
                    type="button"
                    onClick={submitReport}
                    disabled={loading || submitting}
                >
                    {submitting ? "Submitting..." : isEditMode ? "Save Changes" : "Submit"}
                </button>
            </footer>
        </div>
    )
}

export default CreateEditReport
