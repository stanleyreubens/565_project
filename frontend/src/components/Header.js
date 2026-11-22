// Location: frontend/src/components/Header.js

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const { user } = useContext(AuthContext);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
        <Link to="/app" className="logo">Hotel Revenue Manager</Link>
      </div>

      <div className="user-info">
        {user && (
          <>
            <span className="user-name">Hello, {user.name}</span>
            <Link to="/settings" className="settings-link">
              Settings
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;