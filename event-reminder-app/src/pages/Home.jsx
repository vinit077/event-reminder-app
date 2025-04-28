import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './Home.css';
import { auth, db, messaging } from '../services/firebase'; // ✅ Added messaging
import ReminderCard from '../components/ReminderCard';
import '../components/ReminderCard.css';
import DoneSection from '../components/DoneSection';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging'; // ✅ Import FCM functions


// Convert 12-hour format to 24-hour input (for time input field)
function convertTimeTo24Format(time12h) {
  if (!time12h) return '';
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);

  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Convert 24-hour input back to 12-hour format with AM/PM
function formatTimeTo12Hour(time24h) {
  if (!time24h) return '';
  let [hours, minutes] = time24h.split(':');
  hours = parseInt(hours, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

const Home = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [userName, setUserName] = useState('');
  const [activeReminders, setActiveReminders] = useState([]);
  const [doneReminders, setDoneReminders] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    date: '',
    description: ''
  });

  const navigate = useNavigate();
  const [editingReminder, setEditingReminder] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);


  useEffect(() => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
    setCurrentDate(formatted);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserName(user.displayName || user.email.split('@')[0]);
        fetchReminders(user.uid);
        fetchDoneReminders(user.uid); // ✅ fixed here
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe(); // Cleanup
  }, [navigate]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted.");

        const token = await getToken(messaging, { vapidKey: "BHH7x9JiK2Sv1VNdj0RjrrKIZ0CIaAfbWCVRkf8QMcrul6ifj0B6zbaX07AnNFHmWhGM3RMGAlrIaMPSSumWD3w" }); // replace this

        if (token) {
          console.log("FCM Token:", token);

          // Optionally, save token in Firestore under user's profile
          if (auth.currentUser) {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userDocRef, { fcmToken: token }, { merge: true });
            console.log("FCM token saved in Firestore.");
          }
        } else {
          console.warn("No registration token available. Request permission to generate one.");
        }
      } else {
        console.warn("Notification permission not granted.");
      }
    } catch (error) {
      console.error("An error occurred while requesting notification permission:", error);
    }
  };

  useEffect(() => {
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      if (Notification.permission === "granted") {
        const { title, body } = payload.notification;
        new Notification(title, { body });
      }
    });

    return () => unsubscribeOnMessage(); // clean up
  }, []);

  const fetchReminders = async (userId) => {
    const q = query(collection(db, "reminders"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const reminders = [];
    querySnapshot.forEach(docSnap => {
      reminders.push({ firestoreId: docSnap.id, ...docSnap.data() });
    });
    setActiveReminders(sortRemindersByTime(reminders));
  };

  const fetchDoneReminders = async (userId) => {
    const q = query(collection(db, "doneReminders"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const reminders = [];
    querySnapshot.forEach(docSnap => {
      reminders.push({ firestoreId: docSnap.id, ...docSnap.data() });
    });
    setDoneReminders(reminders);
  };

  const sortRemindersByTime = (reminders) => {
    return reminders.sort((a, b) => {
      const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        let [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a.time) - parseTime(b.time);
    });
  };

  const handleDone = async (id) => {
    const completed = activeReminders.find(reminder => reminder.firestoreId === id);
    if (completed) {
      try {
        // Check if the user is allowed to update or move the reminder
        if (completed.userId !== auth.currentUser.uid) {
          throw new Error("You do not have permission to modify this reminder.");
        }
  
        await setDoc(doc(db, "doneReminders", id), completed);
        await deleteDoc(doc(db, "reminders", id));
        console.log("Moved to DoneReminders in Firestore");
  
        setDoneReminders(prev => [...prev, completed]);
        setActiveReminders(prev => prev.filter(reminder => reminder.firestoreId !== id));
      } catch (error) {
        console.error("Error moving reminder to done:", error);
      }
    }
  };

  const handleCancel = async (id) => {
    try {
      await deleteDoc(doc(db, "reminders", id));
      console.log("Reminder deleted from Firestore");
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
    setActiveReminders(prev => prev.filter(reminder => reminder.firestoreId !== id));
  };

  const handleDeleteDone = async (id) => {
    try {
      await deleteDoc(doc(db, "doneReminders", id));
      console.log("Deleted Done Reminder");
      setDoneReminders(prev => prev.filter(reminder => reminder.firestoreId !== id));
    } catch (error) {
      console.error("Error deleting done reminder:", error);
    }
  };

  const handleEditClick = (reminder) => {
    setEditingReminder(reminder);  // Save which reminder we're editing
    setShowEditForm(true);          // Open the edit modal
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder) return;
  
    const reminderRef = doc(db, "reminders", editingReminder.firestoreId);
  
    try {
      await updateDoc(reminderRef, {
        title: editingReminder.title,
        time: editingReminder.time,
        frequency: editingReminder.frequency,
        description: editingReminder.description,
      });
  
      console.log("Reminder updated!");
  
      // Update the local list
      setActiveReminders(prev =>
        sortRemindersByTime(
          prev.map(reminder =>
            reminder.firestoreId === editingReminder.firestoreId
              ? editingReminder
              : reminder
          )
        )
      );
  
      setShowEditForm(false);
      setEditingReminder(null);
    } catch (error) {
      console.error("Error updating reminder:", error);
    }
  };
  
  

  const handleSaveEvent = async () => {
    if (!auth.currentUser) {
      console.error("User not logged in. Cannot save event.");
      alert("Please login again to create a reminder.");
      navigate("/login");
      return;
    }
  
    const [hourStr, minuteStr] = newEvent.time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const formattedTime = `${hour}:${minute} ${ampm}`;
  
    const newReminder = {
      title: newEvent.title,
      time: formattedTime,
      frequency: `One-time | ${newEvent.date}`,
      isOn: true,
      userId: auth.currentUser.uid,  // Ensure the userId is set correctly
      createdAt: new Date(),
    };
  
    try {
      const docRef = await addDoc(collection(db, "reminders"), newReminder);
      console.log('Reminder saved in Firestore with ID:', docRef.id);
  
      setActiveReminders(prev => sortRemindersByTime([
        { firestoreId: docRef.id, ...newReminder },
        ...prev
      ]));
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  
    setShowForm(false);
    setNewEvent({ title: '', time: '', date: '', description: '' });
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  

  return (
    <div className="home-wrapper">
      {/* Header */}
      <header className="top-bar">
        <div className="left-section">
          <img src="/logo192.png" alt="Event Reminder Logo" className="app-icon" />
          <div className="welcome-text">
            <p className="greeting">Welcome {userName}!!</p>
            <p className="date">{currentDate}</p>
          </div>
        </div>

        <div className="right-section">
          <Bell size={20} className="bell-icon" />
          <div className="profile-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
            <img
              src="https://api.dicebear.com/7.x/thumbs/svg?seed=ritu"
              alt="Profile"
              className="profile-pic"
            />
            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Active Reminders */}
      <section className="reminders-section">
        {activeReminders.map(reminder => (
          <ReminderCard
          key={reminder.firestoreId}
          title={reminder.title}
          time={reminder.time}
          frequency={reminder.frequency}
          description={reminder.description} // Add this too
          isOn={reminder.isOn}
          onDoneClick={() => handleDone(reminder.firestoreId)}
          onCancelClick={() => handleCancel(reminder.firestoreId)}
          onEditClick={() => handleEditClick(reminder)} // <=== ADD THIS
        />
        
        ))}
      </section>

      {/* Done Reminders */}
      <DoneSection doneReminders={doneReminders} onDeleteDone={handleDeleteDone} />

      {/* Create Event Button */}
      <div className="create-event-wrapper">
  <button className="create-event-button" onClick={() => setShowForm(true)}>+ Create Event</button>
</div>

{showForm && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Create New Event</h2>
      <input
        type="text"
        placeholder="Title"
        value={newEvent.title}
        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        required
      />
      <input
        type="time"
        value={newEvent.time}
        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
        required
      />
      <input
        type="date"
        value={newEvent.date}
        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        value={newEvent.description}
        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
      />
      <div className="modal-buttons">
        <button onClick={handleSaveEvent}>Save Event</button>
        <button onClick={() => setShowForm(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}

{showEditForm && editingReminder && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Edit Event</h2>
      <input
        type="text"
        placeholder="Title"
        value={editingReminder.title}
        onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
      />
      <input
        type="time"
        value={convertTimeTo24Format(editingReminder.time)}
        onChange={(e) => setEditingReminder({ ...editingReminder, time: formatTimeTo12Hour(e.target.value) })}
      />
      <input
        type="text"
        placeholder="Frequency (ex: One-time | 2025-04-29)"
        value={editingReminder.frequency}
        onChange={(e) => setEditingReminder({ ...editingReminder, frequency: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={editingReminder.description || ''}
        onChange={(e) => setEditingReminder({ ...editingReminder, description: e.target.value })}
      />
      <div className="modal-buttons">
        <button onClick={handleUpdateReminder}>Save Changes</button>
        <button onClick={() => setShowEditForm(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default Home;
