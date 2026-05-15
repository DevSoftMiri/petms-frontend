import { useNavigate } from "react-router-dom";
import "./unauthorized.css";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-container">
            <div className="unauthorized-box">
                <h1>403</h1>
                <h2>Unauthorized Access</h2>
                <p>You don't have permission to access this page.</p>
                <button onClick={() => navigate("/login")}>Go to Login</button>
            </div>
        </div>
    );
};

export default Unauthorized;
