import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <div className="landing-card">
        
        <img src="/images/phone.png" alt="reminder" className="bottom-img" />

        <h2>Welcome to Event Reminder App</h2>
        <p>One Step for all your events</p>

        <button className="login-btn" onClick={() => navigate("/login")}>
          Log in
        </button>
        <button className="register-btn" onClick={() => navigate("/register")}>
          Register
        </button>
        
      </div>
    </div>
  );
};

export default Landing;
