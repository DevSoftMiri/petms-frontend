import { SnackbarProvider } from "notistack";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DarkModeContextProvider } from "./context/darkModeContext";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <DarkModeContextProvider>
    <AuthProvider>
      <SnackbarProvider preventDuplicate>
        <App />
      </SnackbarProvider>
    </AuthProvider>
  </DarkModeContextProvider>
);
