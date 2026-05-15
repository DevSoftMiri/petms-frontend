import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import "./finance.css";

/* ─── tiny helpers ─── */
const fmt = (n) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(n || 0);

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : "—";

const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
});

/* ─── Donut chart ─── */
const Donut = ({ pct = 0, color = "#00c8a0", size = 90, stroke = 10 }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg
            className="donut-svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={stroke}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
        </svg>
    );
};

/* ─── Mini bar chart widget ─── */
const MiniBarChart = ({ transactions }) => {
    // last 6 months buckets
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
            label: d.toLocaleString("default", { month: "short" }),
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            income: 0,
            expense: 0,
        };
    });

    transactions.forEach((t) => {
        if (!t.date) return;
        const key = t.date.slice(0, 7);
        const m = months.find((m) => m.key === key);
        if (!m) return;
        if (t.type === "Income") m.income += t.amount || 0;
        else m.expense += t.amount || 0;
    });

    const maxVal = Math.max(...months.flatMap((m) => [m.income, m.expense]), 1);

    return (
        <div>
            <div className="mini-bars">
                {months.map((m, i) => (
                    <React.Fragment key={i}>
                        <div
                            className="mini-bar income-bar"
                            style={{ height: `${Math.max(4, (m.income / maxVal) * 56)}px` }}
                            title={`Income: ${fmt(m.income)}`}
                        />
                        <div
                            className="mini-bar expense-bar"
                            style={{ height: `${Math.max(4, (m.expense / maxVal) * 56)}px` }}
                            title={`Expense: ${fmt(m.expense)}`}
                        />
                    </React.Fragment>
                ))}
            </div>
            <div className="mini-bar-labels">
                {months.map((m, i) => (
                    <span key={i} className="mini-bar-label" style={{ flex: "2" }}>
                        {m.label}
                    </span>
                ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {[
                    { color: "#00c8a0", label: "Income" },
                    { color: "#f06292", label: "Expense" },
                ].map((l) => (
                    <div
                        key={l.label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            color: "var(--muted)",
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: l.color,
                                display: "inline-block",
                            }}
                        />
                        {l.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─── Payment breakdown bars ─── */
const PaymentBars = ({ transactions }) => {
    const methods = ["Cash", "Card", "UPI", "Bank Transfer", "Other"];
    const total = transactions.length || 1;
    const counts = Object.fromEntries(methods.map((m) => [m, 0]));
    transactions.forEach((t) => {
        const m = t.paymentMethod || "Other";
        counts[m] = (counts[m] || 0) + 1;
    });

    const colors = {
        Cash: "#00c8a0",
        Card: "#4fa3e0",
        UPI: "#9c72f0",
        "Bank Transfer": "#f5a623",
        Other: "#7b8099",
    };

    return (
        <div className="payment-bars">
            {methods
                .filter((m) => counts[m] > 0)
                .map((m) => (
                    <div key={m} className="pay-bar-row">
                        <div className="pay-bar-header">
                            <span>{m}</span>
                            <span>{counts[m]} txn</span>
                        </div>
                        <div className="pay-bar-track">
                            <div
                                className="pay-bar-fill"
                                style={{
                                    width: `${(counts[m] / total) * 100}%`,
                                    background: colors[m] || "#7b8099",
                                }}
                            />
                        </div>
                    </div>
                ))}
        </div>
    );
};

/* ─── KPI Card ─── */
const KpiCard = ({ icon, title, amount, sub, color, colorClass, trend, trendDir }) => (
    <div className={`card ${colorClass || ""}`}>
        <div className="card-icon">{icon}</div>
        <h3>{title}</h3>
        <p className="amount">{amount}</p>
        {sub && <p className="description">{sub}</p>}
        {trend && (
            <span className={`card-trend ${trendDir === "up" ? "trend-up" : "trend-down"}`}>
                {trendDir === "up" ? "▲" : "▼"} {trend}
            </span>
        )}
    </div>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const Finance = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [formData, setFormData] = useState({
        description: "",
        type: "Income",
        amount: 0,
        date: "",
        paymentMethod: "",
        category: "",
        status: "Completed",
    });

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/finance`
            );
            const data = Array.isArray(response) ? response : response.data || [];
            setTransactions(data);
        } catch {
            enqueueSnackbar("Failed to load transactions", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    useEffect(() => {
        if (clinicId) fetchTransactions();
    }, [clinicId, fetchTransactions]);

    /* ── totals ── */
    const income = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + (t.amount || 0), 0);
    const expense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + (t.amount || 0), 0);
    const balance = income - expense;
    const pending = transactions.filter((t) => t.status === "Pending").reduce((s, t) => s + (t.amount || 0), 0);
    const incomePct = income + expense > 0 ? Math.round((income / (income + expense)) * 100) : 0;

    /* ── modal helpers ── */
    const openAdd = () => {
        setEditingTransaction(null);
        setFormData({ description: "", type: "Income", amount: 0, date: "", paymentMethod: "", category: "", status: "Completed" });
        setIsModalOpen(true);
    };

    const openEdit = (t) => {
        setEditingTransaction(t);
        setFormData(t);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.description || !formData.amount) {
                enqueueSnackbar("Description and amount are required", { variant: "error" });
                return;
            }
            if (editingTransaction) {
                await HttpService.putWithAuth(`/clinics/${clinicId}/finance/${editingTransaction._id}`, formData);
                enqueueSnackbar("Transaction updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(`/clinics/${clinicId}/finance`, formData);
                enqueueSnackbar("Transaction added", { variant: "success" });
            }
            setIsModalOpen(false);
            fetchTransactions();
        } catch {
            enqueueSnackbar("Failed to save transaction", { variant: "error" });
        }
    };

    const handleDelete = (id) => {
        if (!window.confirm("Delete this transaction?")) return;
        HttpService.deleteWithAuth(`/clinics/${clinicId}/finance/${id}`)
            .then(() => { enqueueSnackbar("Deleted", { variant: "success" }); fetchTransactions(); })
            .catch(() => enqueueSnackbar("Delete failed", { variant: "error" }));
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    if (!clinicId) return <div style={{ padding: 32, color: "var(--muted)" }}>No clinic selected.</div>;

    return (
        <div className="finance">
            <div className="finance-container">
                <div className="finance-content">

                    {/* ── HEADER ── */}
                    <div className="page-header">
                        <div className="page-header-left">
                            <h1>Finance <span>Overview</span></h1>
                            <p>Track, manage, and analyse clinic revenue &amp; expenses</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="header-date">{today}</div>
                            <button className="btn btn-primary" onClick={openAdd}>
                                ➕ Add Transaction
                            </button>
                        </div>
                    </div>

                    {/* ── KPI CARDS ── */}
                    <div className="summary-cards">
                        <KpiCard
                            icon="💰"
                            title="Total Income"
                            amount={fmt(income)}
                            sub={`${transactions.filter((t) => t.type === "Income").length} transactions`}
                            colorClass="total-card"
                            trend="vs last month"
                            trendDir="up"
                        />
                        <KpiCard
                            icon="🧾"
                            title="Total Expense"
                            amount={fmt(expense)}
                            sub={`${transactions.filter((t) => t.type === "Expense").length} transactions`}
                            colorClass="store-card"
                        />
                        <KpiCard
                            icon="⚖️"
                            title="Net Balance"
                            amount={fmt(balance)}
                            sub="Income minus expenses"
                            colorClass="lab-card"
                            trend={balance >= 0 ? "Profit" : "Loss"}
                            trendDir={balance >= 0 ? "up" : "down"}
                        />
                        <KpiCard
                            icon="⏳"
                            title="Pending"
                            amount={fmt(pending)}
                            sub={`${transactions.filter((t) => t.status === "Pending").length} pending`}
                            colorClass="pending-card"
                        />
                        <KpiCard
                            icon="📊"
                            title="Total Transactions"
                            amount={transactions.length}
                            sub="All time records"
                            colorClass="grooming-card"
                        />
                    </div>

                    {/* ── QUICK STATS ROW ── */}
                    <div className="quick-stats">

                        {/* Monthly bar chart */}
                        <div className="stat-widget">
                            <div className="stat-widget-title">
                                <span>Monthly Revenue</span>
                                <span style={{ color: "var(--teal)", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                                    Last 6 Months
                                </span>
                            </div>
                            <MiniBarChart transactions={transactions} />
                        </div>

                        {/* Income ratio donut */}
                        <div className="stat-widget donut-widget">
                            <div className="stat-widget-title" style={{ width: "100%" }}>
                                <span>Income Ratio</span>
                            </div>
                            <div className="donut-wrap">
                                <Donut pct={incomePct} color="#00c8a0" />
                                <div className="donut-center" style={{ position: "absolute" }}>
                                    <span className="donut-label">{incomePct}%</span>
                                </div>
                            </div>
                            <div className="donut-legend">
                                {[
                                    { color: "#00c8a0", label: "Income", val: fmt(income) },
                                    { color: "#f06292", label: "Expense", val: fmt(expense) },
                                ].map((l) => (
                                    <div key={l.label} className="legend-item">
                                        <span className="legend-dot" style={{ background: l.color }} />
                                        <span style={{ flex: 1 }}>{l.label}</span>
                                        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11 }}>{l.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment method breakdown */}
                        <div className="stat-widget">
                            <div className="stat-widget-title">
                                <span>Payment Methods</span>
                            </div>
                            <PaymentBars transactions={transactions} />
                        </div>

                    </div>

                    {/* ── TRANSACTIONS TABLE ── */}
                    <div className="transactions-section">
                        <div className="section-heading">
                            <h2>Recent <span style={{ color: "var(--teal)" }}>Transactions</span></h2>
                            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--muted)" }}>
                                {transactions.length} records
                            </span>
                        </div>

                        {loading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="loading-shimmer" style={{ height: 48 }} />
                                ))}
                            </div>
                        ) : transactions.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "48px 20px",
                                    color: "var(--muted)",
                                    fontSize: 14,
                                }}
                            >
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                                No transactions yet. Add your first one!
                            </div>
                        ) : (
                            <div className="transactions-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Description</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Payment</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((t, idx) => (
                                            <tr key={t._id}>
                                                <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--muted)" }}>
                                                    {String(idx + 1).padStart(2, "0")}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{t.description}</div>
                                                    {t.category && (
                                                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{t.category}</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge type-${t.type?.toLowerCase()}`}>{t.type}</span>
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            fontFamily: "DM Mono, monospace",
                                                            fontWeight: 600,
                                                            color: t.type === "Income" ? "var(--teal)" : "var(--rose)",
                                                        }}
                                                    >
                                                        {t.type === "Expense" ? "−" : "+"}{fmt(t.amount)}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{fmtDate(t.date)}</td>
                                                <td>
                                                    {t.paymentMethod && (
                                                        <span className={`payment-method method-${t.paymentMethod?.toLowerCase().replace(" ", "")}`}>
                                                            {t.paymentMethod === "Cash" && "💵 "}
                                                            {t.paymentMethod === "Card" && "💳 "}
                                                            {t.paymentMethod === "UPI" && "📱 "}
                                                            {t.paymentMethod}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {t.category && <span className="service-badge">{t.category}</span>}
                                                </td>
                                                <td>
                                                    <span className={`badge status-${t.status?.toLowerCase()}`}>{t.status}</span>
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button className="btn-action edit" onClick={() => openEdit(t)} title="Edit">✏️</button>
                                                        <button className="btn-action delete" onClick={() => handleDelete(t._id)} title="Delete">🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── PROJECTION SECTION ── */}
                    {transactions.length > 0 && (
                        <div className="projection-section">
                            <h2>Financial <span style={{ color: "var(--teal)" }}>Projections</span></h2>
                            <div className="projection-card">
                                {[
                                    {
                                        label: "Projected Monthly Income",
                                        val: fmt((income / Math.max(1, transactions.filter((t) => t.type === "Income").length)) * 30),
                                    },
                                    {
                                        label: "Avg Transaction Value",
                                        val: fmt(income / Math.max(1, transactions.filter((t) => t.type === "Income").length)),
                                    },
                                    {
                                        label: "Pending Recovery",
                                        val: fmt(pending),
                                        warn: pending > 0,
                                    },
                                    {
                                        label: "Expense Ratio",
                                        val: income > 0 ? `${Math.round((expense / income) * 100)}%` : "—",
                                        warn: expense > income,
                                    },
                                ].map((item) => (
                                    <div key={item.label} className="projection-item">
                                        <h4>{item.label}</h4>
                                        <p className={`projection-amount${item.warn ? " warning" : ""}`}>{item.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTransaction ? "Edit Transaction" : "New Transaction"}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    placeholder="e.g. Consultation fee, Medical supplies…"
                                    value={formData.description}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select name="type" value={formData.type} onChange={onChange}>
                                        <option value="Income">💰 Income</option>
                                        <option value="Expense">🧾 Expense</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="0"
                                        value={formData.amount}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" name="date" value={formData.date} onChange={onChange} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select name="paymentMethod" value={formData.paymentMethod} onChange={onChange}>
                                        <option value="">Select method</option>
                                        <option value="Cash">💵 Cash</option>
                                        <option value="Card">💳 Card</option>
                                        <option value="UPI">📱 UPI</option>
                                        <option value="Bank Transfer">🏦 Bank Transfer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={onChange}>
                                        <option value="">Select category</option>
                                        <option value="Service">🩺 Service</option>
                                        <option value="Supplies">📦 Supplies</option>
                                        <option value="Salary">👨‍⚕️ Salary</option>
                                        <option value="Rent">🏢 Rent</option>
                                        <option value="Utilities">💡 Utilities</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={onChange}>
                                    <option value="Completed">✅ Completed</option>
                                    <option value="Pending">⏳ Pending</option>
                                    <option value="Cancelled">❌ Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editingTransaction ? "Update" : "Add Transaction"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;