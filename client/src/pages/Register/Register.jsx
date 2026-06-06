import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import "./Register.css"
import Header from "../../components/Header/Header"

function Register() {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'student'
    })

    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    const handleChange = ({ target: { name, value } }) => {
        setForm(prev => ({
            ...prev, [name]: value
        }))
    }

    const submit = async () => {
        const res = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        const data = await res.json();

        if (res.ok) {
            navigate('/login')
        } else {
            setMessage('Error: ' + data.error)
        }
    }

    return (
        <div className="register-page">

            <Header showUserInfo={false} />

            <div className="register-container">
                <div className="register-box">

                <h2>Register</h2>

                <input name="first_name" placeholder="First name" onChange={handleChange} />
                <input name="last_name" placeholder="Last name" onChange={handleChange} />
                <input name="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />

                <div className="register-role-row">
                    <div className="register-role-label">Role</div>

                    <select className="register-role-select" name="role" onChange={handleChange}>
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>

                <div className="register-buttons">
                    <button className="register-primary-btn" onClick={submit}>Register</button>

                    <Link to="/login">
                        <button className="register-secondary-btn">Exit</button>
                    </Link>
                </div>

                {message && <p>{message}</p>}
            </div>
        </div>

    </div>
    )
}

export default Register;
