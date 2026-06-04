import React, { useState } from "react";
import "./VetDashboardNav.css";

const VetDashboardNav = ({ activeView, onViewChange, counts }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    {
      id: "assigned",
      label: "Assigned Pets",
      icon: "🐾",
      count: counts.assigned || 0,
    },
    {
      id: "cases",
      label: "My Cases",
      icon: "📋",
      count: counts.cases || 0,
    },
    {
      id: "inpatient",
      label: "Inpatient Pets",
      icon: "🏥",
      count: counts.inpatient || 0,
    },
    {
      id: "closed",
      label: "Closed Case Pets",
      icon: "✅",
      count: counts.closed || 0,
    },
  ];

  const selectedOption = options.find((opt) => opt.id === activeView);

  return (
    <div className="vet-dashboard-nav">
      <div className="vet-nav-dropdown">
        <button
          className="vet-nav-dropdown-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="vet-nav-icon">{selectedOption?.icon}</span>
          <span className="vet-nav-label">{selectedOption?.label}</span>
          <span className="vet-nav-count">{selectedOption?.count}</span>
          <span className="vet-nav-arrow">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="vet-nav-dropdown-menu">
            {options.map((option) => (
              <button
                key={option.id}
                className={`vet-nav-option ${activeView === option.id ? "active" : ""
                  }`}
                onClick={() => {
                  onViewChange(option.id);
                  setIsOpen(false);
                }}
              >
                <span className="vet-nav-icon">{option.icon}</span>
                <span className="vet-nav-label">{option.label}</span>
                <span className="vet-nav-count">{option.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VetDashboardNav;
