import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "notistack";

import HttpService from "../../services/HttpService";
import "./events.css";

const Events = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        location: "",
        type: "",
        attendees: 0,
        status: "Confirmed",
    });

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await HttpService.getWithAuth(
                `/clinics/${clinicId}/events`
            );
            const data = Array.isArray(response) ? response : response.data || [];
            setEvents(data);
        } catch (error) {
            enqueueSnackbar("Failed to load events", { variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [clinicId, enqueueSnackbar]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (clinicId) fetchEvents();
    }, [clinicId, fetchEvents]);


    const handleAddEvent = () => {
        setEditingEvent(null);
        setFormData({
            title: "",
            date: "",
            time: "",
            location: "",
            type: "",
            attendees: 0,
            status: "Confirmed",
        });
        setIsModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setFormData(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async () => {
        try {
            if (!formData.title || !formData.date) {
                enqueueSnackbar("Title and date are required", { variant: "error" });
                return;
            }

            if (editingEvent) {
                await HttpService.putWithAuth(
                    `/clinics/${clinicId}/events/${editingEvent._id}`,
                    formData
                );
                enqueueSnackbar("Event updated", { variant: "success" });
            } else {
                await HttpService.postWithAuth(
                    `/clinics/${clinicId}/events`,
                    formData
                );
                enqueueSnackbar("Event created", { variant: "success" });
            }

            setIsModalOpen(false);
            fetchEvents();
        } catch {
            enqueueSnackbar("Failed to save event", { variant: "error" });
        }
    };

    const handleDeleteEvent = (id) => {
        if (!window.confirm("Delete this event?")) return;

        HttpService.deleteWithAuth(`/clinics/${clinicId}/events/${id}`)
            .then(() => {
                enqueueSnackbar("Event deleted", { variant: "success" });
                fetchEvents();
            })
            .catch(() => {
                enqueueSnackbar("Delete failed", { variant: "error" });
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="events">
            <div className="events-container">
                <div className="events-content">
                    <div className="page-header">
                        <div>
                            <h1>Events</h1>
                            <p>Manage all your events and schedules</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleAddEvent}>
                            ➕ Create Event
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="events-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Event Title</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Location</th>
                                        <th>Type</th>
                                        <th>Attendees</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <tr key={event._id}>
                                            <td className="event-title">{event.title}</td>
                                            <td>{event.date}</td>
                                            <td>{event.time}</td>
                                            <td>{event.location}</td>
                                            <td>
                                                <span className={`badge type-${event.type?.toLowerCase()}`}>
                                                    {event.type}
                                                </span>
                                            </td>
                                            <td className="center">{event.attendees}</td>
                                            <td>
                                                <span className={`badge status-${event.status?.toLowerCase()}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="actions">
                                                <button
                                                    className="btn-action edit"
                                                    onClick={() => handleEditEvent(event)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDeleteEvent(event._id)}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {isModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{editingEvent ? "Edit Event" : "Create New Event"}</h2>
                                    <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Event Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            placeholder="Enter event title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Time</label>
                                            <input
                                                type="time"
                                                name="time"
                                                value={formData.time}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="Enter location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Event Type</label>
                                            <select name="type" value={formData.type} onChange={handleInputChange}>
                                                <option value="">Select type</option>
                                                <option value="Vaccination">Vaccination</option>
                                                <option value="Checkup">Checkup</option>
                                                <option value="Grooming">Grooming</option>
                                                <option value="Training">Training</option>
                                                <option value="Surgery">Surgery</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Attendees</label>
                                            <input
                                                type="number"
                                                name="attendees"
                                                placeholder="Number of attendees"
                                                value={formData.attendees}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveEvent}>
                                        {editingEvent ? "Update Event" : "Create Event"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Events;
