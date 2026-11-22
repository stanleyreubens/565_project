// Location: frontend/src/pages/Settings.js

import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Location: frontend/src/pages/Settings.js (continued)
 const [isUpdating, setIsUpdating] = useState(false);
 const [updateMessage, setUpdateMessage] = useState('');
 const [updateError, setUpdateError] = useState('');

 const handleProfileUpdate = async (e) => {
   e.preventDefault();
   setIsUpdating(true);
   setUpdateMessage('');
   setUpdateError('');
   
   // In a real app, you'd make an API call here
   setTimeout(() => {
     setUpdateMessage('Profile updated successfully!');
     setIsUpdating(false);
   }, 1000);
 };

 const handlePasswordUpdate = async (e) => {
   e.preventDefault();
   
   if (newPassword !== confirmPassword) {
     setUpdateError('New passwords do not match');
     return;
   }
   
   setIsUpdating(true);
   setUpdateMessage('');
   setUpdateError('');
   
   // In a real app, you'd make an API call here
   setTimeout(() => {
     setUpdateMessage('Password updated successfully!');
     setIsUpdating(false);
     setCurrentPassword('');
     setNewPassword('');
     setConfirmPassword('');
   }, 1000);
 };

 return (
   <div className="settings-page">
     <h1>Account Settings</h1>
     
     {updateMessage && <div className="success-message">{updateMessage}</div>}
     {updateError && <div className="error-message">{updateError}</div>}
     
     <div className="settings-container">
       <div className="profile-settings">
         <h2>Profile Information</h2>
         <form onSubmit={handleProfileUpdate}>
           <div className="form-group">
             <label htmlFor="name">Name</label>
             <input
               type="text"
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="email">Email</label>
             <input
               type="email"
               id="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
             />
           </div>
           
           <button type="submit" className="button" disabled={isUpdating}>
             {isUpdating ? 'Updating...' : 'Update Profile'}
           </button>
         </form>
       </div>
       
       <div className="password-settings">
         <h2>Change Password</h2>
         <form onSubmit={handlePasswordUpdate}>
           <div className="form-group">
             <label htmlFor="currentPassword">Current Password</label>
             <input
               type="password"
               id="currentPassword"
               value={currentPassword}
               onChange={(e) => setCurrentPassword(e.target.value)}
               required
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="newPassword">New Password</label>
             <input
               type="password"
               id="newPassword"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               required
               minLength="6"
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="confirmPassword">Confirm New Password</label>
             <input
               type="password"
               id="confirmPassword"
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               required
               minLength="6"
             />
           </div>
           
           <button type="submit" className="button" disabled={isUpdating}>
             {isUpdating ? 'Updating...' : 'Update Password'}
           </button>
         </form>
       </div>
       
       <div className="account-actions">
         <h2>Account Actions</h2>
         <button onClick={logout} className="button logout-button">
           Log Out
         </button>
       </div>
     </div>
   </div>
 );
};

export default Settings;