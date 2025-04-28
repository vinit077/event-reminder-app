import React from "react";
import "./Navbar.css";

const NavBar = () => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="logo">LOGO</div>
      </div>
      <div className="navbar-center">
        <h1>Welcome to Event Reminder</h1>
      </div>
      <div className="navbar-right">
        <button className="icon-button">🔔</button>
        <button className="icon-button">👤</button>
      </div>
    </header>
  );
};

export default NavBar;
