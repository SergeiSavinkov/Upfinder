import { useNavigate } from "react-router-dom"
import "./NavigationButtons.css"

function NavigationButtons() {
    const navigate = useNavigate()

    return (
        <div className="navigation-buttons">
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={() => navigate("/login")}>Log Out</button>
        </div>
    )
}

export default NavigationButtons