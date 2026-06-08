import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Header from "../../components/Header/Header"
import NavigationButtons from "../../components/NavigationButtons/NavigationButtons"
import "./Chat.css"
import { API_URL } from "../../config";

async function readJsonResponse(res, fallbackMessage) {
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.error || fallbackMessage)
    }

    return data
}

function getContactName(contact) {
    return contact?.email || "User"
}

function Chat() {
    const navigate = useNavigate()
    const { state } = useLocation()
    const currentUser = JSON.parse(localStorage.getItem("user") || "null")

    const [contacts, setContacts] = useState([])
    const [activeContact, setActiveContact] = useState(state?.contact || null)
    const [messages, setMessages] = useState([])
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!currentUser?.id) {
            navigate("/login")
            return
        }

        async function loadContacts() {
            try {
                const res = await fetch(`${API_URL}/messages/contacts/${currentUser.id}`)
                const data = await readJsonResponse(res, "Failed to load chats")

                setContacts(data)

                // Если есть state contact, найти его в загруженных контактах чтобы получить полные данные
                if (state?.contact) {
                    const fullContact = data.find(c =>
                        Number(c.user_id) === Number(state.contact.user_id) &&
                        Number(c.item_report_id) === Number(state.contact.item_report_id)
                    )
                    setActiveContact(fullContact || state.contact)
                } else {
                    setActiveContact(data[0] || null)
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadContacts()
    }, [currentUser?.id, navigate, state?.contact])

    useEffect(() => {
        if (!currentUser?.id || !activeContact?.user_id || !activeContact?.item_report_id) {
            return
        }

        const params = new URLSearchParams({
            userId: currentUser.id,
            contactId: activeContact.user_id,
            itemReportId: activeContact.item_report_id
        })

        fetch(`${API_URL}/messages?${params}`)
            .then(res => readJsonResponse(res, "Failed to load messages"))
            .then(setMessages)
            .catch(err => setError(err.message))
    }, [currentUser?.id, activeContact])

    const submitMessage = async event => {
        event.preventDefault()

        if (!content.trim() || !activeContact) return

        setError("")

        try {
            const res = await fetch(`${API_URL}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender_id: currentUser.id,
                    receiver_id: activeContact.user_id,
                    item_report_id: activeContact.item_report_id,
                    content
                })
            })
            const message = await readJsonResponse(res, "Failed to send message")

            setMessages(prev => [...prev, message])
            setContent("")
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="chat-page">
            <Header>
                <NavigationButtons backTo="/dashboard" />
            </Header>

            <main className="chat-main">
                <div className="chat-title-row">
                    <div>
                        <span>Messages</span>
                        <h2>Chat</h2>
                    </div>
                </div>

                <section className="chat-shell">
                    <aside className="chat-sidebar">
                        <h3>Contacts</h3>

                        {loading && <p className="chat-empty">Loading...</p>}
                        {!loading && contacts.length === 0 && <p className="chat-empty">No chats yet.</p>}

                        <div className="chat-contact-list">
                            {contacts.map(contact => {
                                const isActive =
                                    Number(activeContact?.user_id) === Number(contact.user_id) &&
                                    Number(activeContact?.item_report_id) === Number(contact.item_report_id)

                                return (
                                    <button
                                        key={`${contact.user_id}-${contact.item_report_id}`}
                                        className={`chat-contact ${isActive ? "active" : ""}`}
                                        onClick={() => setActiveContact(contact)}
                                    >
                                        <span>{getContactName(contact)}</span>
                                        <small>{contact.item_name || "Lost item"}</small>
                                    </button>
                                )
                            })}
                        </div>
                    </aside>

                    <section className="chat-panel">
                        {activeContact ? (
                            <>
                                <div className="chat-panel-header">
                                    <div>
                                        <h3>{getContactName(activeContact)}</h3>
                                        <span>{activeContact.item_name || "Report"}</span>
                                    </div>
                                </div>

                                <div className="chat-messages">
                                    {messages.length === 0 && (
                                        <p className="chat-empty">No messages yet.</p>
                                    )}

                                    {messages.map(message => {
                                        const own = Number(message.sender_id) === Number(currentUser.id)

                                        return (
                                            <div key={message.id} className={`chat-message ${own ? "own" : ""}`}>
                                                <p>{message.content}</p>
                                                <span>{new Date(message.created_at).toLocaleString()}</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                <form className="chat-form" onSubmit={submitMessage}>
                                    <input
                                        value={content}
                                        onChange={event => setContent(event.target.value)}
                                        placeholder="Write a message..."
                                    />
                                    <button type="submit" disabled={!content.trim()}>Send</button>
                                </form>
                            </>
                        ) : (
                            <div className="chat-no-contact"></div>
                        )}
                    </section>
                </section>

                {error && <p className="chat-error">{error}</p>}
            </main>
        </div>
    )
}

export default Chat
