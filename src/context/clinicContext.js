import { createContext, useReducer } from "react";

export const ClinicContext = createContext();

const initialState = {
    selectedClinic: JSON.parse(localStorage.getItem("selectedClinic") || "null"),
    selectedClinicId: localStorage.getItem("selectedClinicId"),
};

const clinicReducer = (state, action) => {
    switch (action.type) {
        case "SET_CLINIC":
            localStorage.setItem("selectedClinic", JSON.stringify(action.payload));
            localStorage.setItem("selectedClinicId", action.payload?.id || action.payload?._id || "");
            return {
                selectedClinic: action.payload,
                selectedClinicId: action.payload?.id || action.payload?._id,
            };
        case "CLEAR_CLINIC":
            localStorage.removeItem("selectedClinic");
            localStorage.removeItem("selectedClinicId");
            return {
                selectedClinic: null,
                selectedClinicId: null,
            };
        default:
            return state;
    }
};

export const ClinicProvider = ({ children }) => {
    const [state, dispatch] = useReducer(clinicReducer, initialState);

    return (
        <ClinicContext.Provider value={{ state, dispatch }}>
            {children}
        </ClinicContext.Provider>
    );
};
