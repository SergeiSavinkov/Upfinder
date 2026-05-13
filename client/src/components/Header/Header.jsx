import "./Header.css"

function Header() {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="logo-block">
                    <img src="/logo.png" alt="logo" />

                    <span>Univerza na Primorskem</span>
                </div>
            </div>
        </header>
    )
}

export default Header
