import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";

import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import "./events.css";

const VET_COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#7c3aed",
    "#ea580c",
    "#0891b2",
    "#be123c",
    "#4f46e5",
];

const START_HOUR = 8;
const END_HOUR = 20;
const HOUR_HEIGHT = 72;
const DAY_MS = 24 * 60 * 60 * 1000;

const getResponseDataArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const getVetName = (vet) => {
    if (!vet) return "Unassigned vet";

    const fullName = [vet.firstName, vet.lastName].filter(Boolean).join(" ");
    return fullName || vet.username || vet.email || "Unnamed vet";
};

const getCustomerName = (customer) => {
    if (!customer) return "No client";

    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
    return fullName || customer.name || "Client";
};

const isSameDay = (firstDate, secondDate) => (
    firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
);

const formatDateValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatTime = (date) => (
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
);

const getAppointmentDuration = (reason = "") => {
    const reasonText = reason.toLowerCase();
    return reasonText.includes("surgery") || reasonText.includes("procedure") ? 120 : 30;
};

const startOfWeek = (date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - day);
    return copy;
};

const getWeekDates = (date) => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * DAY_MS));
};

const getMonthDates = (date) => {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridStart = startOfWeek(firstOfMonth);
    return Array.from({ length: 42 }, (_, index) => new Date(gridStart.getTime() + index * DAY_MS));
};

const normalizeAppointment = (appointment, vetColorMap) => {
    const startTime = new Date(appointment.appointmentDate);
    const duration = getAppointmentDuration(appointment.reason || "");
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const vetName = getVetName(appointment.vet);
    const petName = appointment.pet?.name || "Patient";

    return {
        id: appointment.id,
        vetId: appointment.vetId,
        vetName,
        petName,
        customerName: getCustomerName(appointment.customer),
        reason: appointment.reason || "Appointment",
        status: appointment.status || "PENDING",
        notes: appointment.notes || "",
        startTime,
        endTime,
        duration,
        color: vetColorMap.get(appointment.vetId) || "#2563eb",
    };
};

const AppointmentCard = ({ appointment, compact = false }) => (
    <div
        className={`appointment-block ${compact ? "compact" : ""}`}
        style={{ "--appointment-color": appointment.color }}
        title={`${appointment.petName} - ${appointment.reason}`}
    >
        <strong>{appointment.petName}</strong>
        <span>{appointment.reason}</span>
        <small>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</small>
        {!compact && (
            <>
                <small>{appointment.vetName}</small>
                <em>{appointment.status}</em>
            </>
        )}
    </div>
);

const Events = ({ clinicId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const currentUser = AuthService.getCurrentUser();
    const canViewAllVets = ["SUPERADMIN", "ADMIN"].includes(currentUser?.role);

    const [appointments, setAppointments] = useState([]);
    const [vets, setVets] = useState([]);
    const [selectedVetId, setSelectedVetId] = useState(canViewAllVets ? "all" : currentUser?.id || "all");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeView, setActiveView] = useState("day");
    const [loading, setLoading] = useState(true);

    const fetchAppointments = useCallback(async () => {
        if (!clinicId) return;

        try {
            setLoading(true);
            const endpoint = canViewAllVets
                ? `/clinics/${clinicId}/appointments?limit=100`
                : `/clinics/${clinicId}/vet/appointments`;
            const response = await HttpService.getWithAuth(endpoint);
            const data = getResponseDataArray(response);

            setAppointments(data);
            if (data[0]?.appointmentDate) {
                setSelectedDate(new Date(data[0].appointmentDate));
            }
        } catch (error) {
            console.error(error);
            enqueueSnackbar("Failed to load appointments", { variant: "error" });
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, [canViewAllVets, clinicId, enqueueSnackbar]);

    const fetchVets = useCallback(async () => {
        if (!clinicId) return;

        try {
            const response = await HttpService.getWithAuth(`/users?clinicId=${clinicId}&role=VET&limit=100`);
            setVets(getResponseDataArray(response));
        } catch (error) {
            console.error(error);
            setVets([]);
        }
    }, [clinicId]);

    useEffect(() => {
        fetchAppointments();
        fetchVets();
    }, [fetchAppointments, fetchVets]);

    useEffect(() => {
        setSelectedVetId(canViewAllVets ? "all" : currentUser?.id || "all");
    }, [canViewAllVets, currentUser?.id]);

    const vetColorMap = useMemo(() => {
        const map = new Map();
        vets.forEach((vet, index) => {
            map.set(vet.id, VET_COLORS[index % VET_COLORS.length]);
        });
        return map;
    }, [vets]);

    const normalizedAppointments = useMemo(() => (
        appointments
            .filter((appointment) => appointment.appointmentDate)
            .map((appointment) => normalizeAppointment(appointment, vetColorMap))
    ), [appointments, vetColorMap]);

    const visibleAppointments = useMemo(() => {
        if (selectedVetId === "all") return normalizedAppointments;
        return normalizedAppointments.filter((appointment) => appointment.vetId === selectedVetId);
    }, [normalizedAppointments, selectedVetId]);

    const visibleVets = useMemo(() => {
        if (selectedVetId !== "all") {
            const vet = vets.find((item) => item.id === selectedVetId);
            return vet ? [vet] : [{ id: currentUser?.id || "current", firstName: currentUser?.firstName, lastName: currentUser?.lastName, username: currentUser?.username }];
        }

        if (vets.length > 0) return vets;

        const vetIds = [...new Set(normalizedAppointments.map((appointment) => appointment.vetId).filter(Boolean))];
        return vetIds.map((vetId) => ({
            id: vetId,
            username: normalizedAppointments.find((appointment) => appointment.vetId === vetId)?.vetName || "Vet",
        }));
    }, [currentUser, normalizedAppointments, selectedVetId, vets]);

    const selectedDayAppointments = useMemo(() => (
        visibleAppointments.filter((appointment) => isSameDay(appointment.startTime, selectedDate))
    ), [selectedDate, visibleAppointments]);

    const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
    const monthDates = useMemo(() => getMonthDates(selectedDate), [selectedDate]);
    const hours = useMemo(() => (
        Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)
    ), []);

    const todayCount = useMemo(() => {
        const today = new Date();
        return visibleAppointments.filter((appointment) => isSameDay(appointment.startTime, today)).length;
    }, [visibleAppointments]);

    const moveDate = (amount) => {
        const nextDate = new Date(selectedDate);
        if (activeView === "month") {
            nextDate.setMonth(nextDate.getMonth() + amount);
        } else if (activeView === "week") {
            nextDate.setDate(nextDate.getDate() + amount * 7);
        } else {
            nextDate.setDate(nextDate.getDate() + amount);
        }
        setSelectedDate(nextDate);
    };

    const getDateLabel = () => {
        if (activeView === "month") {
            return selectedDate.toLocaleDateString([], { month: "long", year: "numeric" });
        }

        if (activeView === "week") {
            const start = weekDates[0];
            const end = weekDates[6];
            return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} - ${end.toLocaleDateString([], { month: "short", day: "numeric" })}`;
        }

        return selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    };

    if (!clinicId) return <div>No clinic selected</div>;

    return (
        <div className="events appointments-page">
            <div className="events-container appointments-shell">
                <div className="events-content appointments-content">
                    <div className="appointments-header">
                        <div>
                            <h1>Appointments</h1>
                            <p>Vet schedules, patient visits, and surgery blocks</p>
                        </div>

                        <div className="appointments-summary">
                            <div>
                                <span>{visibleAppointments.length}</span>
                                <small>Total</small>
                            </div>
                            <div>
                                <span>{todayCount}</span>
                                <small>Today</small>
                            </div>
                        </div>
                    </div>

                    <div className="vet-filter-bar" aria-label="Vet schedule filters">
                        {canViewAllVets && (
                            <button
                                className={`vet-filter ${selectedVetId === "all" ? "active" : ""}`}
                                onClick={() => setSelectedVetId("all")}
                                type="button"
                            >
                                <span className="vet-color" style={{ backgroundColor: "#111827" }} />
                                All vets
                            </button>
                        )}

                        {vets.map((vet) => (
                            <button
                                className={`vet-filter ${selectedVetId === vet.id ? "active" : ""}`}
                                key={vet.id}
                                onClick={() => setSelectedVetId(vet.id)}
                                type="button"
                            >
                                <span
                                    className="vet-color"
                                    style={{ backgroundColor: vetColorMap.get(vet.id) || "#2563eb" }}
                                />
                                {getVetName(vet)}
                            </button>
                        ))}
                    </div>

                    <div className="scheduler-panel">
                        <div className="scheduler-panel-header">
                            <div>
                                <h2>{getDateLabel()}</h2>
                                <p>Appointments are shown from 8 AM to 8 PM.</p>
                            </div>

                            <div className="schedule-controls">
                                <div className="view-switcher">
                                    {["day", "week", "month"].map((view) => (
                                        <button
                                            className={activeView === view ? "active" : ""}
                                            key={view}
                                            onClick={() => setActiveView(view)}
                                            type="button"
                                        >
                                            {view}
                                        </button>
                                    ))}
                                </div>

                                <div className="date-controls">
                                    <button onClick={() => moveDate(-1)} type="button">‹</button>
                                    <input
                                        type="date"
                                        value={formatDateValue(selectedDate)}
                                        onChange={(event) => setSelectedDate(new Date(`${event.target.value}T00:00:00`))}
                                    />
                                    <button onClick={() => moveDate(1)} type="button">›</button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="scheduler-loading">Loading appointments...</div>
                        ) : (
                            <>
                                {activeView === "day" && (
                                    <div className="custom-scheduler day-schedule">
                                        <div className="schedule-grid">
                                            <div className="time-column">
                                                <div className="schedule-corner" />
                                                {hours.map((hour) => (
                                                    <div className="time-cell" key={hour}>
                                                        {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                                    </div>
                                                ))}
                                            </div>

                                            <div
                                                className="vet-columns"
                                                style={{ gridTemplateColumns: `repeat(${Math.max(visibleVets.length, 1)}, minmax(220px, 1fr))` }}
                                            >
                                                {visibleVets.map((vet) => {
                                                    const vetAppointments = selectedDayAppointments.filter((appointment) => appointment.vetId === vet.id);

                                                    return (
                                                        <div className="vet-day-column" key={vet.id}>
                                                            <div className="vet-column-header">
                                                                <span
                                                                    className="vet-color"
                                                                    style={{ backgroundColor: vetColorMap.get(vet.id) || "#2563eb" }}
                                                                />
                                                                {getVetName(vet)}
                                                            </div>

                                                            <div className="day-column-body">
                                                                {hours.map((hour) => (
                                                                    <div className="hour-line" key={hour} />
                                                                ))}

                                                                {vetAppointments.map((appointment) => {
                                                                    const minutesFromStart = Math.max(0, ((appointment.startTime.getHours() - START_HOUR) * 60) + appointment.startTime.getMinutes());
                                                                    const top = (minutesFromStart / 60) * HOUR_HEIGHT;
                                                                    const height = Math.max(36, (appointment.duration / 60) * HOUR_HEIGHT);

                                                                    return (
                                                                        <div
                                                                            className="timed-appointment"
                                                                            key={appointment.id}
                                                                            style={{
                                                                                "--appointment-color": appointment.color,
                                                                                top,
                                                                                height,
                                                                            }}
                                                                        >
                                                                            <AppointmentCard appointment={appointment} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeView === "week" && (
                                    <div className="custom-scheduler week-schedule">
                                        {weekDates.map((date) => {
                                            const dayAppointments = visibleAppointments
                                                .filter((appointment) => isSameDay(appointment.startTime, date))
                                                .sort((first, second) => first.startTime - second.startTime);

                                            return (
                                                <div className="week-day-card" key={date.toISOString()}>
                                                    <div className="week-day-header">
                                                        <strong>{date.toLocaleDateString([], { weekday: "short" })}</strong>
                                                        <span>{date.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                                                    </div>

                                                    <div className="week-day-list">
                                                        {dayAppointments.length === 0 ? (
                                                            <p>No appointments</p>
                                                        ) : dayAppointments.map((appointment) => (
                                                            <AppointmentCard appointment={appointment} compact key={appointment.id} />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {activeView === "month" && (
                                    <div className="custom-scheduler month-schedule">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                            <div className="month-weekday" key={day}>{day}</div>
                                        ))}

                                        {monthDates.map((date) => {
                                            const dayAppointments = visibleAppointments
                                                .filter((appointment) => isSameDay(appointment.startTime, date))
                                                .sort((first, second) => first.startTime - second.startTime);
                                            const isOutsideMonth = date.getMonth() !== selectedDate.getMonth();

                                            return (
                                                <div
                                                    className={`month-day-cell ${isOutsideMonth ? "muted" : ""}`}
                                                    key={date.toISOString()}
                                                >
                                                    <span className="month-day-number">{date.getDate()}</span>
                                                    <div className="month-appointments">
                                                        {dayAppointments.slice(0, 3).map((appointment) => (
                                                            <div
                                                                className="month-pill"
                                                                key={appointment.id}
                                                                style={{ "--appointment-color": appointment.color }}
                                                            >
                                                                {formatTime(appointment.startTime)} {appointment.petName}
                                                            </div>
                                                        ))}
                                                        {dayAppointments.length > 3 && (
                                                            <small>+{dayAppointments.length - 3} more</small>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Events;
