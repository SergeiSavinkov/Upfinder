import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import "./Login.css"
import Header from "../../components/Header/Header"

function Login() {
    const [form, setForm] = useState({
        email: '',
        password: '',
    })

    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    const handleChange = ({ target: { name, value } }) => {
        setForm(prev => ({
            ...prev, [name]: value
        }))
    }

    const submit = async () => {
        const res = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })

        if (res.ok) {
            const user = await res.json()
            console.log('USER:', user)

            localStorage.setItem("user", JSON.stringify(user))

            setMessage('Login successful')

            navigate('/dashboard')
        } else {
            const err = await res.json()
            setMessage('Error: ' + err.error)
        }
    }

    return (
        <div className="login-page">
            <Header showUserInfo={false} />

            <div className="login-container">
                <h2>Login</h2>

                <input name="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                <div className="buttons">
                    <Link to="/register">
                        <button className="secondary-btn">Register</button>
                    </Link>

                    <button className="primary-btn" onClick={submit}>Login</button>
                </div>

                {message && <p>{message}</p>}
            </div>
        </div>
    )
}

export default Login