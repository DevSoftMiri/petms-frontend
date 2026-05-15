import "./dashboardCard.css";

const DashboardCard = ({ icon, color, title, count, buttonLabel, buttonColor, buttonIcon }) => {
    return (
        <div className="dashboard-card">
            <div className="card-top">
                <div className="card-icon-box" style={{ backgroundColor: color }}>
                    <span className="card-icon">{icon}</span>
                </div>
                <div className="card-info">
                    <span className="card-title">{title}</span>
                    <span className="card-count">{count}</span>
                </div>
            </div>
            <div className="card-divider" />
            <div className="card-bottom">
                <span className="card-btn-icon" style={{ color: buttonColor }}>
                    {buttonIcon}
                </span>
                <button
                    className="card-btn"
                    style={{ backgroundColor: buttonColor }}
                    onClick={() => { }}
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
};

export default DashboardCard;
