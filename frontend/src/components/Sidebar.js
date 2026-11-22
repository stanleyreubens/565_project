// Location: frontend/src/components/Sidebar.js

import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <ul className="nav-menu">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hotels"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Hotels
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/competitors"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Competitor Analysis
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/events"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Events Calendar
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pricing"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Price Recommendations
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/star-report"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              STAR Report
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/smerf"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              SMERF Calendar
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reminders"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Reminders
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleNavClick}
            >
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
