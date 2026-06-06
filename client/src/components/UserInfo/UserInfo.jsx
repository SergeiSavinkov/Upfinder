import "./UserInfo.css"

function UserInfo() {
    const user = JSON.parse(localStorage.getItem("user") || "null")

    if (!user?.last_name) return null

    const firstInitial = user.first_name?.charAt(0) || ""
    const userLabel = `${user.last_name}${firstInitial ? ` ${firstInitial}.` : ""}`

    return (
        <div className="user-info">
            <span>{userLabel}</span>
        </div>
    )
}

export default UserInfo