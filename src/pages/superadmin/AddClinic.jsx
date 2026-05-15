import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SuperAdminNavbar from "../../components/superadmin/SuperAdminNavbar";
import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
import "./addClinic.css";

const AddClinic = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clinicName: "",
        clinicCode: "",
        email: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        licenseNumber: "",
        businessHours: "9AM-6PM",
        operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        maxUsers: 50,
        subscription: "ENTERPRISE",
        description: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOperatingDaysChange = (day) => {
        setFormData((prev) => ({
            ...prev,
            operatingDays: prev.operatingDays.includes(day)
                ? prev.operatingDays.filter((d) => d !== day)
                : [...prev.operatingDays, day],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.clinicName || !formData.clinicCode || !formData.email) {
            enqueueSnackbar("Clinic name, code, and email are required", { variant: "warning" });
            return;
        }

        setLoading(true);
        try {
            // Only send fields that backend expects
            const clinicData = {
                clinicName: formData.clinicName,
                clinicCode: formData.clinicCode,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country,
                licenseNumber: formData.licenseNumber,
                maxUsers: parseInt(formData.maxUsers, 10) || 10,
                subscriptionPlan: formData.subscription.toUpperCase(),
            };

            console.log("Sending clinic data:", clinicData);
            await HttpService.postWithAuth("/clinics", clinicData);
            enqueueSnackbar("Clinic created successfully", { variant: "success" });
            navigate("/superadmin/dashboard");
        } catch (error) {
            console.error("Full error response:", error.response?.data);

            // Handle validation errors
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                console.error("Validation errors details:", error.response.data.errors);
                const errorMessages = error.response.data.errors
                    .map(err => `${err.field}: ${err.message}`)
                    .join('\n');
                console.error("Formatted errors:", errorMessages);
                enqueueSnackbar(`Validation Error:\n${errorMessages}`, {
                    variant: "error",
                    autoHideDuration: 5000
                });
            } else {
                const message = error.response?.data?.message || "Failed to create clinic";
                enqueueSnackbar(message, { variant: "error" });
            }
        } finally {
            setLoading(false);
        }
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div>
            <SuperAdminNavbar />
            <div style={{ display: "flex" }}>
                <Sidebar />
                <div className="add-clinic-container">
                    <div className="add-clinic-header">
                        <button
                            className="back-btn"
                            onClick={() => navigate("/superadmin/dashboard")}
                        >
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                            Back
                        </button>
                        <h1>Add New Centre</h1>
                    </div>

                    <form className="add-clinic-form" onSubmit={handleSubmit}>
                        {/* Clinic Basic Information */}
                        <div className="form-section">
                            <h2>Basic Information</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Centre Name *</label>
                                    <input
                                        type="text"
                                        name="clinicName"
                                        value={formData.clinicName}
                                        onChange={handleInputChange}
                                        placeholder="Enter Centre name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Centre Code *</label>
                                    <input
                                        type="text"
                                        name="clinicCode"
                                        value={formData.clinicCode}
                                        onChange={handleInputChange}
                                        placeholder="Enter unique centre code"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="clinic@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="+91 xxx-xxx-xxxx"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Clinic description"
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>

                        {/* Location Information */}
                        <div className="form-section">
                            <h2>Location</h2>

                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Street address"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Zip Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        placeholder="Zip code"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* License & Business Information */}
                        <div className="form-section">
                            <h2>License & Business</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>License Number</label>
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        value={formData.licenseNumber}
                                        onChange={handleInputChange}
                                        placeholder="License number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Hours</label>
                                    <input
                                        type="text"
                                        name="businessHours"
                                        value={formData.businessHours}
                                        onChange={handleInputChange}
                                        placeholder="9AM-6PM"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Operating Days</label>
                                <div className="days-checkbox">
                                    {days.map((day) => (
                                        <label key={day} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.operatingDays.includes(day)}
                                                onChange={() => handleOperatingDaysChange(day)}
                                            />
                                            <span>{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Subscription Information */}
                        <div className="form-section">
                            <h2>Subscription</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Subscription Plan</label>
                                    <select
                                        name="subscription"
                                        value={formData.subscription}
                                        onChange={handleInputChange}
                                    >

                                        <option value="STARTER">STARTER</option>
                                        <option value="PROFESSIONAL">PROFESSIONAL</option>
                                        <option value="ENTERPRISE">ENTERPRISE</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Max Users</label>
                                    <input
                                        type="number"
                                        name="maxUsers"
                                        value={formData.maxUsers}
                                        onChange={handleInputChange}
                                        placeholder="50"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => navigate("/superadmin/dashboard")}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Create Clinic"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddClinic;
