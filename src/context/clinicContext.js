import { createContext, useReducer } from "react";

export const ClinicContext = createContext();

const initialState = {
    selectedClinic: null,
    selectedClinicId: null,
};

const clinicReducer = (state, action) => {
    switch (action.type) {
        case "SET_CLINIC":
            return {
                selectedClinic: action.payload,
                selectedClinicId: action.payload?.id || action.payload?._id,
            };
        case "CLEAR_CLINIC":
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
