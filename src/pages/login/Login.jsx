import "./login.css";

const Login = () => {
    return (
        <div className="login-container">
            <div className="restricted-box">
                <h1>You are restricted</h1>
                <p>Access has been disabled </p>
            </div>

            {/*
                Login form temporarily disabled until access is restored.

                <div className="login-box">
                    <div className="login-header">
                        <h1>Pet Managment</h1>
                        <p>Pet Veterinary Management System</p>
                    </div>

                    <form onSubmit={handleSubmit}>
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
                                    Show
                                </button>
                            </div>
                        </div>

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
            */}
        </div>
    );
};

export default Login;
