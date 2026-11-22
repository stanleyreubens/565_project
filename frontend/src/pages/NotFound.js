// Location: frontend/src/pages/NotFound.js

import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="button">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;