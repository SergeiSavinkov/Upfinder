import "./Header.css"
import UserInfo from "../UserInfo/UserInfo"

function Header({ children, showUserInfo = true }) {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="logo-block">
                    <img src="/logo.png" alt="logo" />
                    <span>Univerza na Primorskem</span>
                </div>

                {showUserInfo && <UserInfo />}

                {children && (
                    <div className="header-actions">
                        {children}
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
