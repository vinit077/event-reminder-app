import React, { useState } from 'react';
import './ReminderCard.css';
import { Check } from 'lucide-react';

const ReminderCard = ({
  title,
  time,
  frequency,
  isOn: initialIsOn,
  onDoneClick,
  onCancelClick,
  onEditClick, // <=== accept it
  isDone,
  description,
}) => {

  const [isOn, setIsOn] = useState(initialIsOn);

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  return (
    <div className={`reminder-card ${isDone ? 'done' : ''}`}>
      <div className="reminder-header">
        <h3>{title}</h3>
        <div className={`toggle-switch ${isOn ? 'on' : 'off'}`} onClick={toggleSwitch}>
          <div className="toggle-knob"></div>
        </div>
      </div>
      <p className="reminder-time">{time}</p>
      <p className="reminder-frequency">{frequency}</p>
      <div className="reminder-footer">
        <div className="button-group">
          {!isDone && (
            <>
              <button className="done-button" onClick={onDoneClick}>
                <Check size={16} /> Done
              </button>
              <button className="cancel-button" onClick={onCancelClick}>
                Cancel
              </button>
              <button onClick={onEditClick} className="edit-button">Edit</button>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
