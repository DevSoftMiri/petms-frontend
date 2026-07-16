import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import HttpService from '../../services/HttpService';
import DashboardCard from '../../components/dashboardCard/DashboardCard';
import './dashboard.css';

const Dashboard = ({ clinicId: propClinicId }) => {
    const { clinicId: paramClinicId } = useParams();
    const clinicId = propClinicId || paramClinicId;
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/dashboard`
            );

            if (response.success) {
                setDashboardData(response.data);
            } else {
                setError(response.message || 'Failed to load dashboard data');
            }
        } catch (err) {
            setError(err.message || 'Failed to load dashboard data');
            console.error('Dashboard fetch error:', err);
        }
    }, [clinicId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Close error message
    const handleCloseError = () => {
        setError(null);
    };

    // Error state
    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-snackbar">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <span className="error-message">{error}</span>
                    </div>
                    <button className="error-close" onClick={handleCloseError}>
                        ✕
                    </button>
                </div>
                <div className="error-retry">
                    <button className="retry-btn" onClick={fetchDashboardData}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!dashboardData) {
        return (
            <div className="dashboard-container">
                <div className="empty-state">
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Statistics Cards Grid */}
            <div className="dashboard-section">
                <h2 className="section-title">Statistics</h2>
                <div className="dashboard-grid">
                    {/* Total Pets */}
                    <DashboardCard
                        icon="🐾"
                        color="#FF6B6B"
                        title="Total Pets"
                        count={dashboardData.totalPets}
                        buttonLabel="View Pets"
                        buttonColor="#FF6B6B"
                        buttonIcon="→"
                    />

                    {/* Total Customers */}
                    <DashboardCard
                        icon="👥"
                        color="#4ECDC4"
                        title="Total Clients"
                        count={dashboardData.totalCustomers}
                        buttonLabel="View Customers"
                        buttonColor="#4ECDC4"
                        buttonIcon="→"
                    />

                    {/* Total Staff */}
                    <DashboardCard
                        icon="👔"
                        color="#45B7D1"
                        title="Total Staff"
                        count={dashboardData.totalStaff}
                        buttonLabel="Manage Staff"
                        buttonColor="#45B7D1"
                        buttonIcon="→"
                    />

                    {/* Total Appointments */}
                    <DashboardCard
                        icon="📅"
                        color="#96CEB4"
                        title="Total Appointments"
                        count={dashboardData.totalAppointments}
                        buttonLabel="View All"
                        buttonColor="#96CEB4"
                        buttonIcon="→"
                    />

                    {/* Today's Appointments */}
                    <DashboardCard
                        icon="📆"
                        color="#FFEAA7"
                        title="Today's Appointments"
                        count={dashboardData.todayAppointments}
                        buttonLabel="View Today"
                        buttonColor="#FFEAA7"
                        buttonIcon="→"
                    />

                    {/* Pending Appointments */}
                    <DashboardCard
                        icon="⏳"
                        color="#DDA15E"
                        title="Pending Appointments"
                        count={dashboardData.pendingAppointments}
                        buttonLabel="Review"
                        buttonColor="#DDA15E"
                        buttonIcon="→"
                    />

                    {/* Completed Appointments */}
                    <DashboardCard
                        icon="✓"
                        color="#6BCB77"
                        title="Completed Appointments"
                        count={dashboardData.completedAppointments}
                        buttonLabel="View Details"
                        buttonColor="#6BCB77"
                        buttonIcon="→"
                    />

                    {/* Total Grooming Records */}
                    <DashboardCard
                        icon="✂️"
                        color="#B19CD9"
                        title="Total Grooming Records"
                        count={dashboardData.totalGroomings}
                        buttonLabel="View Records"
                        buttonColor="#B19CD9"
                        buttonIcon="→"
                    />

                    {/* Total Pharmacy Records */}
                    <DashboardCard
                        icon="💊"
                        color="#FF9FF3"
                        title="Total Pharmacy Records"
                        count={dashboardData.totalPharmacyRecords}
                        buttonLabel="View Records"
                        buttonColor="#FF9FF3"
                        buttonIcon="→"
                    />

                    {/* Total Inventory Supplies */}
                    <DashboardCard
                        icon="📦"
                        color="#74B9FF"
                        title="Total Inventory Supplies"
                        count={dashboardData.totalSupplies}
                        buttonLabel="Manage Inventory"
                        buttonColor="#74B9FF"
                        buttonIcon="→"
                    />

                    {/* Low Stock Supplies */}
                    <DashboardCard
                        icon="⚠️"
                        color="#FF7675"
                        title="Low Stock Supplies"
                        count={dashboardData.lowStockSupplies}
                        buttonLabel="Reorder Now"
                        buttonColor="#FF7675"
                        buttonIcon="→"
                    />

                    {/* Monthly Revenue */}
                    <DashboardCard
                        icon="💰"
                        color="#00B894"
                        title="Monthly Revenue"
                        count={`₹${dashboardData.monthlyRevenue.toFixed(2)}`}
                        buttonLabel="View Finance"
                        buttonColor="#00B894"
                        buttonIcon="→"
                    />
                </div>
            </div>

            {/* Upcoming Appointments */}
            {dashboardData.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 && (
                <div className="dashboard-section">
                    <h2 className="section-title">📅 Upcoming Appointments (Next 7 Days)</h2>
                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Pet Name</th>
                                    <th>Customer</th>
                                    <th>Vet</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.upcomingAppointments.map((apt) => (
                                    <tr key={apt.id}>
                                        <td>{apt.petName}</td>
                                        <td>{apt.customerName}</td>
                                        <td>{apt.vetName}</td>
                                        <td>
                                            {new Date(apt.appointmentDate).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Appointments */}
            {dashboardData.recentAppointments && dashboardData.recentAppointments.length > 0 && (
                <div className="dashboard-section">
                    <h2 className="section-title">📋 Recent Appointments</h2>
                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Pet Name</th>
                                    <th>Customer</th>
                                    <th>Vet</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.recentAppointments.map((apt) => (
                                    <tr key={apt.id}>
                                        <td>{apt.petName}</td>
                                        <td>{apt.customerName}</td>
                                        <td>{apt.vetName}</td>
                                        <td>
                                            {new Date(apt.appointmentDate).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Low Stock Alerts */}
            {dashboardData.lowStockSupplies > 0 && (
                <div className="dashboard-section alert-section">
                    <h2 className="section-title">⚠️ Low Stock Alert</h2>
                    <div className="alert-box">
                        <p className="alert-message">
                            You have <strong>{dashboardData.lowStockSupplies}</strong> supplies running low on stock.
                            Please review and reorder as needed.
                        </p>
                        <button className="alert-action-btn">
                            Go to Inventory
                        </button>
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 && (
                <div className="dashboard-section">
                    <h2 className="section-title">💳 Recent Transactions</h2>
                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Category</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.recentTransactions.map((txn) => (
                                    <tr key={txn.id}>
                                        <td className="transaction-desc">{txn.description}</td>
                                        <td>
                                            <span className={`type-badge type-${txn.type.toLowerCase()}`}>
                                                {txn.type}
                                            </span>
                                        </td>
                                        <td className={txn.type === 'Income' ? 'amount-income' : 'amount-expense'}>
                                            {txn.type === 'Income' ? '+' : '-'}${txn.amount.toFixed(2)}
                                        </td>
                                        <td>{txn.category || 'N/A'}</td>
                                        <td>{new Date(txn.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge status-${txn.status.toLowerCase()}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;