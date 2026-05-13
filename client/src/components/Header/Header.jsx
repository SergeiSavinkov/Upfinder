import "./Header.css"

function Header({ children }) {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="logo-block">
                    <img src="/logo.png" alt="logo" />

                    <span>Univerza na Primorskem</span>
                </div>

                {children}
            </div>
        </header>
    )
}

export default Header
