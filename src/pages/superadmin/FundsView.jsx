import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSnackbar } from "notistack";
import AddIcon from "@mui/icons-material/Add";
import HttpService from "../../services/HttpService";
import { uploadFundsProof } from "../../services/StorageService";

const PAYMENT_MODE_OPTIONS = ["Cash", "RTGS", "NEFT", "Cheque", "UPI"];

const getTodayDate = () => new Date().toISOString().split("T")[0];

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : "N/A";

const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "N/A";

const formatAmount = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const FundsView = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [funds, setFunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        donorName: "",
        amount: "",
        date: getTodayDate(),
        paymentMode: PAYMENT_MODE_OPTIONS[0],
        receivedBy: "",
    });

    const fetchFunds = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth("/superadmin/funds");
            setFunds(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Error fetching funds:", error);
            enqueueSnackbar("Failed to load funds", { variant: "error" });
            setFunds([]);
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    const resetForm = () => {
        setFormData({
            donorName: "",
            amount: "",
            date: getTodayDate(),
            paymentMode: PAYMENT_MODE_OPTIONS[0],
            receivedBy: "",
        });
        setSelectedFile(null);
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUploading(false);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onDrop = useCallback((acceptedFiles) => {
        if (!acceptedFiles?.length) return;

        const file = acceptedFiles[0];
        const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

        if (!validTypes.includes(file.type)) {
            enqueueSnackbar("Please select a PDF or image file (JPG, PNG, GIF, WebP)", { variant: "error" });
            return;
        }

        setSelectedFile(file);
    }, [enqueueSnackbar]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
        },
        multiple: false,
    });

    const handleSaveFund = async () => {
        try {
            if (!formData.donorName || !formData.amount || !formData.date || !formData.paymentMode || !formData.receivedBy) {
                enqueueSnackbar("Donor name, amount, date, payment mode, and received by are required", { variant: "error" });
                return;
            }

            let proofUrl = "";
            let proofFileName = "";
            let proofMimeType = "";

            if (selectedFile) {
                setUploading(true);
                try {
                    proofUrl = await uploadFundsProof(selectedFile);
                    proofFileName = selectedFile.name;
                    proofMimeType = selectedFile.type;
                } catch (uploadError) {
                    enqueueSnackbar(`Failed to upload proof: ${uploadError.message}`, { variant: "error" });
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            await HttpService.postWithAuth("/superadmin/funds", {
                ...formData,
                amount: Number(formData.amount),
                proofUrl,
                proofFileName,
                proofMimeType,
            });

            enqueueSnackbar("Fund entry created successfully", { variant: "success" });
            handleCloseModal();
            fetchFunds();
        } catch (error) {
            console.error("Error saving fund entry:", error);
            enqueueSnackbar(error?.response?.data?.message || "Failed to save fund entry", { variant: "error" });
            setUploading(false);
        }
    };

    return (
        <>
            <div className="funds-toolbar">
                <button className="add-clinic-btn" onClick={handleOpenModal}>
                    <AddIcon sx={{ fontSize: 20 }} />
                    <span>Add Funds</span>
                </button>
            </div>

            {loading ? (
                <div className="loading"><span className="loading-text">Loading funds...</span></div>
            ) : funds.length === 0 ? (
                <div className="empty-state">
                    <p>No fund entries yet</p>
                    <button onClick={handleOpenModal}>Add First Fund Entry</button>
                </div>
            ) : (
                <div className="users-table-container funds-table-container">
                    <table className="users-table funds-table">
                        <thead>
                            <tr>
                                <th>Donor Name</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Payment Mode</th>
                                <th>Received By</th>
                                <th>Proof</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funds.map((fund) => (
                                <tr key={fund.id}>
                                    <td title={fund.donorName}>{fund.donorName}</td>
                                    <td>{formatAmount(fund.amount)}</td>
                                    <td>{formatDate(fund.date)}</td>
                                    <td>{fund.paymentMode}</td>
                                    <td title={fund.receivedBy}>{fund.receivedBy}</td>
                                    <td>
                                        {fund.proofUrl ? (
                                            <div className="fund-proof-actions">
                                                <a href={fund.proofUrl} target="_blank" rel="noopener noreferrer" className="proof-link">
                                                    View
                                                </a>
                                                {/* <a href={fund.proofUrl} target="_blank" rel="noopener noreferrer" download className="proof-link">
                                                    Download
                                                </a> */}
                                            </div>
                                        ) : (
                                            <span className="proof-missing">No proof</span>
                                        )}
                                    </td>
                                    <td>{formatDateTime(fund.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Funds Entry</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Donor Name *</label>
                                    <input
                                        type="text"
                                        name="donorName"
                                        placeholder="Enter donor name"
                                        value={formData.donorName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amount *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="Enter amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Payment Mode *</label>
                                    <select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        onChange={handleInputChange}
                                    >
                                        {PAYMENT_MODE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Received By *</label>
                                    <input
                                        type="text"
                                        name="receivedBy"
                                        placeholder="Enter receiver details"
                                        value={formData.receivedBy}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Upload Proof</label>
                                <div
                                    {...getRootProps()}
                                    className={`file-dropzone funds-dropzone ${isDragActive ? "active" : ""}`}
                                >
                                    <input {...getInputProps()} />
                                    {selectedFile ? (
                                        <div className="selected-file">
                                            <span>{selectedFile.type === "application/pdf" ? "📄" : "🖼️"} {selectedFile.name}</span>
                                            <button
                                                type="button"
                                                className="btn-remove-file"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : isDragActive ? (
                                        <p>Drop the proof file here...</p>
                                    ) : (
                                        <p>Drag and drop a PDF or image file here, or click to select</p>
                                    )}
                                </div>

                                {selectedFile && (
                                    <div className="funds-file-actions">
                                        <button
                                            type="button"
                                            className="proof-link proof-link-button"
                                            onClick={() => {
                                                const fileUrl = URL.createObjectURL(selectedFile);
                                                window.open(fileUrl, "_blank");
                                            }}
                                        >
                                            Preview File
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveFund} disabled={uploading}>
                                {uploading ? "Uploading..." : "Save Funds Entry"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FundsView;
