import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "./CreateEditReport.css"

const API_URL = "http://localhost:5000"

function getUniqueOptions(items, key) {
    return [...new Set(items.map(item => item[key]).filter(Boolean))]
}

function getReportImageUrl(report) {
    return report.has_image ? `${API_URL}/reports/${report.id}/image` : ""
}

function SuggestInput({ label, name, value, placeholder, options, onChange }) {
    const [open, setOpen] = useState(false)

    const filteredOptions = options.filter(option => {
        return option.toLowerCase().includes(value.toLowerCase())
    })

    const selectOption = option => {
        onChange({
            target: {
                name,
                value: option
            }
        })
        setOpen(false)
    }

    return (
        <label className="create-report-suggest-field">
            {label}

            <div className="create-report-suggest">
                <input
                    name={name}
                    value={value}
                    onChange={event => {
                        onChange(event)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        setTimeout(() => setOpen(false), 120)
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                />

                <button type="button" className="create-report-suggest-toggle" onMouseDown={event => event.preventDefault()} onClick={() => setOpen(prev => !prev)}>
                    v
                </button>

                {open && filteredOptions.length > 0 && (
                    <div className="create-report-suggest-menu">
                        {filteredOptions.map(option => (
                            <button key={option} type="button" onMouseDown={event => event.preventDefault()} onClick={() => selectOption(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </label>
    )
}

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
        status: "open"
    })

    const [categories, setCategories] = useState([])
    const [locations, setLocations] = useState([])
    const [message, setMessage] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState("")
    const [loading, setLoading] = useState(isEditMode)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        async function loadOptions() {
            try {
                const res = await fetch(`${API_URL}/reports`)
                const reports = await res.json()

                if (!res.ok) {
                    throw new Error(reports.error || "Failed to load reports")
                }

                setCategories(getUniqueOptions(reports, "category_name"))
                setLocations(getUniqueOptions(reports, "location_name"))
            } catch (err) {
                setMessage("Error: " + err.message)
            }
        }

        loadOptions()
    }, [])

    useEffect(() => {
        if (!isEditMode) return

        async function fetchReport() {
            try {
                const res = await fetch(`${API_URL}/reports/${id}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load report")
                }

                setForm({
                    item_name: data.item_name || "",
                    item_description: data.item_description || data.description || "",
                    report_type: data.report_type || "lost",
                    category_name: data.category_name || "",
                    location_name: data.location_name || "",
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
            const body = new FormData()

            if (!isEditMode) {
                body.append("user_id", user?.id)
            }

            body.append("item_name", form.item_name)
            body.append("item_description", form.item_description)
            body.append("report_type", form.report_type)
            body.append("category_name", form.category_name)
            body.append("location_name", form.location_name)
            body.append("status", form.status)

            if (imageFile) {
                body.append("image", imageFile)
            }

            if (isEditMode) {
                const res = await fetch(`${API_URL}/reports/${id}`, {
                    method: "PUT",
                    body
                })
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to update report")
                }
            } else {
                const res = await fetch(`${API_URL}/reports`, {
                    method: "POST",
                    body
                })
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to create report")
                }
            }

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

                            <SuggestInput label="Category" name="category_name" value={form.category_name} placeholder="Category" options={categories} onChange={handleChange} />

                            <SuggestInput label="Location" name="location_name" value={form.location_name} placeholder="Location" options={locations} onChange={handleChange} />
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
