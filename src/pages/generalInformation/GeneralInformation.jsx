import Navbar from "../../components/navbar/Navbar";
import Sidebar from "../../components/sidebar/Sidebar";
import "./generalInformation.css";

const GeneralInformation = () => {
    return (
        <div className="general-info">
            <Sidebar />
            <div className="general-info-container">
                <Navbar />

                <div className="general-info-content">
                    <div className="page-header">
                        <h1>General Information</h1>
                        <p>Manage general pet information and details</p>
                    </div>

                    <div className="info-section">
                        <div className="info-card">
                            <h3>Pet Overview</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Pet Name:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Species:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Breed:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Age:</label>
                                    <span>Not Selected</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Owner Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Owner Name:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Contact:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Email:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Address:</label>
                                    <span>Not Selected</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Health Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Weight:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Microchip:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Blood Type:</label>
                                    <span>Not Selected</span>
                                </div>
                                <div className="info-item">
                                    <label>Allergies:</label>
                                    <span>None</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="btn btn-primary">Edit Information</button>
                        <button className="btn btn-secondary">Export Report</button>
                        <button className="btn btn-secondary">Print</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralInformation;
