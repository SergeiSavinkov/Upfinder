import { useNavigate } from "react-router-dom"
import "./NavigationButtons.css"

function NavigationButtons({ backTo }) {
    const navigate = useNavigate()
    const goBack = () => {
        if (backTo) {
            navigate(backTo)
            return
        }

        navigate(-1)
    }

    return (
        <div className="navigation-buttons">
            <button onClick={goBack}>Back</button>
            <button onClick={() => navigate("/login")}>Log Out</button>
        </div>
    )
}

export default NavigationButtons
