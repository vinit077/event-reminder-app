import React from 'react';
import ReminderCard from './ReminderCard'; 
import './DoneSection.css'; // optional, if you want to style differently

const DoneSection = ({ doneReminders, onDeleteDone }) => {
    return (
      <section className="done-section">
        <h2>Done Event ✅</h2>
        {doneReminders.length === 0 ? (
          <p className="no-done">No tasks completed yet!</p>
        ) : (
          doneReminders.map((reminder) => (
            <div key={reminder.firestoreId} className="done-reminder-card">
              <ReminderCard
                title={reminder.title}
                time={reminder.time}
                frequency={reminder.frequency}
                isOn={false}
                isDone={true}
              />
              <button className="delete-done-button" onClick={() => onDeleteDone(reminder.firestoreId)}>Delete</button>
            </div>
          ))
        )}
      </section>
    );
  };
  

export default DoneSection;
