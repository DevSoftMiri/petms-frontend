import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

const Login = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            enqueueSnackbar("Please enter username/email and password", { variant: "warning" });
            return;
        }

        setLoading(true);
        try {
            const response = await login(formData.username, formData.password);

            enqueueSnackbar("Login successful!", { variant: "success" });

            // Clear form
            setFormData({
                username: "",
                password: "",
            });

            // Redirect based on role from backend
            const userRole = response.data?.user?.role;
            console.log("Login - User Role:", userRole);

            if (userRole === "SUPERADMIN") {
                navigate("/superadmin/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (error) {
            const message = error.response?.data?.message || "Login failed. Please try again.";
            enqueueSnackbar(message, { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>Pet Managment</h1>
                    <p>Pet Veterinary Management System</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Username/Email Field */}
                    <div className="form-group">
                        <label htmlFor="username">Email or Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Enter your email or username"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-field">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="show-password-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Secure Pet Veterinary Management</p>
                    <p style={{ fontSize: "0.85rem", marginTop: "1rem", opacity: 0.7 }}>
                        Demo Credentials:<br />
                        Email: superadmin@petvms.com<br />
                        Password: Admin@12345
                    </p>
                </div>
            </div>

            {/* Background Shape */}
            <div className="login-bg-shape"></div>
        </div>
    );
};

export default Login;
