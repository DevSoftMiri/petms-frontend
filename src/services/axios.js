import axios from "axios";

// Backend API configuration
// Uses environment variable REACT_APP_API_BASE_URL
// Defaults to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const instance = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests
instance.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.accessToken) {
            config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh on 401
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (error.response?.status === 401 && user?.refreshToken) {
            try {
                const response = await axios.post(
                    `${API_BASE_URL}/api/v1/auth/refresh-token`,
                    { refreshToken: user.refreshToken }
                );

                // Update token in storage
                const updatedUser = {
                    ...user,
                    accessToken: response.data.data.accessToken,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                // Retry original request
                error.config.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
                return instance(error.config);
            } catch (err) {
                localStorage.removeItem("user");
                window.location.href = window.location.origin + "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
