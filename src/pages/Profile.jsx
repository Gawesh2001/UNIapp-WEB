import React, { useState, useEffect } from 'react';
import {
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaBell,
  FaExclamationCircle,
  FaCheckCircle,
  FaArrowLeft
} from 'react-icons/fa';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import userSession from '../utils/UserSession';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(userSession.currentUser);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [studentAppointments, setStudentAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    const unsubscribe = userSession.subscribe((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser?.uid) return;

        if (currentUser.role === 'student') {
          if (currentUser.faculty && currentUser.degreeProgram && currentUser.batchNumber) {
            const modulesPath = collection(
              db,
              'Faculties',
              currentUser.faculty,
              'Degrees',
              currentUser.degreeProgram,
              'Batches',
              currentUser.batchNumber,
              'Modules'
            );

            const snapshot = await getDocs(modulesPath);
            setModules(snapshot.docs.map(doc => doc.id));
          }

          const q = query(
            collection(db, 'Appointments'),
            where('studentId', '==', currentUser.uid)
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const appointmentsData = [];
            let hasNew = false;
            
            snapshot.forEach((doc) => {
              const appt = { id: doc.id, ...doc.data() };
              appointmentsData.push(appt);
              
              if (appt.status !== 'Pending' && !appt.studentViewed) {
                hasNew = true;
              }
            });

            setStudentAppointments(appointmentsData);
            setHasNewNotifications(hasNew);
            appointmentsData.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time}`);
              const dateB = new Date(`${b.date}T${b.time}`);
              return dateB - dateA;
            });
          });

          return unsubscribe;
        } else if (currentUser.role === 'staff') {
          const q = query(
            collection(db, 'Appointments'),
            where('lecturerId', '==', currentUser.uid)
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const appointmentsData = [];
            snapshot.forEach((doc) => {
              appointmentsData.push({ id: doc.id, ...doc.data() });
            });
            setAppointments(appointmentsData);
          });

          return unsubscribe;
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const moduleRef = doc(
        db,
        'Faculties',
        currentUser.faculty,
        'Degrees',
        currentUser.degreeProgram,
        'Batches',
        currentUser.batchNumber,
        'Modules',
        'SDTP'
      );

      const moduleSnap = await getDoc(moduleRef);
      
      if (!moduleSnap.exists()) {
        throw new Error('SDTP module not found');
      }

      const lecturerUid = moduleSnap.data().uid;
      const lecturerRef = doc(db, 'UserDetails', lecturerUid);
      const lecturerSnap = await getDoc(lecturerRef);

      if (!lecturerSnap.exists()) {
        throw new Error('Lecturer not found in UserDetails');
      }

      const lecturerData = lecturerSnap.data();

      const appointmentData = {
        studentId: currentUser.uid,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        module: 'SDTP',
        date,
        time,
        reason,
        faculty: currentUser.faculty,
        status: 'Pending',
        lecturerId: lecturerData.uid,
        lecturerName: lecturerData.name,
        lecturerEmail: lecturerData.email,
        createdAt: serverTimestamp(),
        lecturerReply: '',
        studentViewed: false
      };

      await addDoc(collection(db, 'Appointments'), appointmentData);
      setSuccess(true);
      setDate('');
      setTime('');
      setReason('');
    } catch (err) {
      console.error('Appointment error:', err);
      setError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to approve this appointment?')) return;
    
    try {
      await updateDoc(doc(db, 'Appointments', appointmentId), {
        status: 'Approved',
        lecturerReply: 'Appointment approved',
        updatedAt: serverTimestamp(),
        studentViewed: false
      });
    } catch (err) {
      console.error('Error approving appointment:', err);
      setError('Failed to approve appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    const rejectionReason = window.prompt('Please enter rejection reason:');
    if (!rejectionReason) return;
    
    try {
      await updateDoc(doc(db, 'Appointments', appointmentId), {
        status: 'Rejected',
        lecturerReply: rejectionReason,
        updatedAt: serverTimestamp(),
        studentViewed: false
      });
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      setError('Failed to reject appointment');
    }
  };

  const markAsViewed = async (appointmentId) => {
    try {
      await updateDoc(doc(db, 'Appointments', appointmentId), {
        studentViewed: true
      });
      setHasNewNotifications(false);
    } catch (err) {
      console.error('Error marking as viewed:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const filteredAppointments = appointments.filter(appt => {
    switch (activeTab) {
      case 'pending': return appt.status === 'Pending';
      case 'approved': return appt.status === 'Approved';
      case 'rejected': return appt.status === 'Rejected';
      default: return true;
    }
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });

  if (!currentUser?.uid) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2><FaUser /> Profile</h2>
          <p>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Back Button - Matches Announcements Style */}
      <button 
        onClick={() => navigate(-1)} 
        className="special-back-button"
      >
        <FaArrowLeft /> BACK TO ANNOUNCEMENTS
      </button>

      <div className={`profile-card ${currentUser.role === 'staff' ? 'lecturer-view' : ''}`}>
        <h2>
          {currentUser.role === 'student' ? (
            <><FaUserGraduate /> Student Profile</>
          ) : (
            <><FaChalkboardTeacher /> Lecturer Profile</>
          )}
        </h2>
        
        <div className="profile-details">
          <p><strong>Name:</strong> {currentUser.name}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          {currentUser.faculty && (
            <p><strong>Faculty:</strong> {currentUser.faculty}</p>
          )}
          {currentUser.degreeProgram && (
            <p><strong>Degree:</strong> {currentUser.degreeProgram}</p>
          )}
          {currentUser.batchNumber && (
            <p><strong>Batch:</strong> {currentUser.batchNumber}</p>
          )}
          <p><strong>Role:</strong> {currentUser.role}</p>
          {currentUser.role === 'staff' && (
            <p><strong>Assigned Modules:</strong> SDTP</p>
          )}
        </div>

        {currentUser.role === 'student' && (
          <>
            <div className="profile-section">
              <h3><FaBook /> Your Modules</h3>
              {loading ? (
                <p>Loading modules...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : modules.length > 0 ? (
                <ul className="module-list">
                  {modules.map((module) => (
                    <li key={module}>{module}</li>
                  ))}
                </ul>
              ) : (
                <p>No modules found</p>
              )}
            </div>

            <div className="profile-section">
              <div className="section-header">
                <h3><FaCalendarAlt /> Your Appointments</h3>
                {hasNewNotifications && (
                  <span className="notification-badge">
                    <FaBell /> New Response
                  </span>
                )}
              </div>
              
              {studentAppointments.length > 0 ? (
                <div className="appointments-list">
                  {studentAppointments.map((appt) => (
                    <div 
                      key={appt.id} 
                      className={`appointment-card status-${appt.status.toLowerCase()} ${!appt.studentViewed && appt.status !== 'Pending' ? 'unread' : ''}`}
                      onClick={() => markAsViewed(appt.id)}
                    >
                      <div className="appointment-header">
                        <h4>{appt.module} with {appt.lecturerName}</h4>
                        <span className={`status-badge ${appt.status.toLowerCase()}`}>
                          {appt.status === 'Pending' ? (
                            <FaSpinner className="spinner" />
                          ) : appt.status === 'Approved' ? (
                            <FaCheckCircle />
                          ) : (
                            <FaExclamationCircle />
                          )}
                          {appt.status}
                        </span>
                      </div>
                      
                      <div className="appointment-details">
                        <p><strong>Date:</strong> {formatDate(appt.date)} at {appt.time}</p>
                        <p><strong>Reason:</strong> {appt.reason}</p>
                        
                        {appt.status !== 'Pending' && (
                          <>
                            <p><strong>Lecturer Response:</strong> {appt.lecturerReply}</p>
                            <p><small>Updated: {appt.updatedAt?.toDate().toLocaleString()}</small></p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No appointments booked yet</p>
              )}
            </div>

            <div className="profile-section">
              <button 
                onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                className="btn-action"
              >
                {showAppointmentForm ? 'Cancel' : 'Book New Appointment'}
              </button>
              
              {showAppointmentForm && (
                <div className="appointment-form">
                  {success ? (
                    <div className="success-message">
                      <h3>Appointment Booked Successfully!</h3>
                      <p>Your lecturer will respond soon.</p>
                      <button 
                        onClick={() => setSuccess(false)}
                        className="btn-action"
                      >
                        Book Another
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3>Book SDTP Appointment</h3>
                      {error && <p className="error">{error}</p>}
                      <form onSubmit={handleAppointmentSubmit}>
                        <div className="form-group">
                          <label><FaCalendarAlt /> Date:</label>
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label><FaClock /> Time:</label>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            min="09:00"
                            max="17:00"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label><FaInfoCircle /> Reason:</label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Briefly explain the purpose of this meeting"
                            required
                            minLength={10}
                          />
                        </div>

                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="btn-submit"
                        >
                          {submitting ? (
                            <>
                              <FaSpinner className="spinner" /> Submitting...
                            </>
                          ) : 'Submit Appointment'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {currentUser.role === 'staff' && (
          <>
            <div className="profile-section">
              <h3><FaCalendarAlt /> Appointment Requests</h3>
              
              <div className="appointment-tabs">
                <button
                  className={activeTab === 'pending' ? 'active' : ''}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending
                </button>
                <button
                  className={activeTab === 'approved' ? 'active' : ''}
                  onClick={() => setActiveTab('approved')}
                >
                  Approved
                </button>
                <button
                  className={activeTab === 'rejected' ? 'active' : ''}
                  onClick={() => setActiveTab('rejected')}
                >
                  Rejected
                </button>
              </div>
              
              {loading ? (
                <div className="loading-spinner">
                  <FaSpinner className="spinner" /> Loading appointments...
                </div>
              ) : error ? (
                <p className="error">{error}</p>
              ) : filteredAppointments.length > 0 ? (
                <div className="appointments-list">
                  {filteredAppointments.map((appt) => (
                    <div key={appt.id} className={`appointment-card status-${appt.status.toLowerCase()}`}>
                      <div className="appointment-header">
                        <h4>{appt.module} - {appt.studentName}</h4>
                        <span className={`status-badge ${appt.status.toLowerCase()}`}>
                          {appt.status}
                        </span>
                      </div>
                      
                      <div className="appointment-details">
                        <p><strong>Student:</strong> {appt.studentEmail}</p>
                        <p><strong>Date:</strong> {formatDate(appt.date)} at {appt.time}</p>
                        <p><strong>Reason:</strong> {appt.reason}</p>
                        
                        {appt.status !== 'Pending' && (
                          <p><strong>Your Response:</strong> {appt.lecturerReply}</p>
                        )}
                      </div>
                      
                      {appt.status === 'Pending' && (
                        <div className="appointment-actions">
                          <button 
                            onClick={() => handleApproveAppointment(appt.id)}
                            className="btn-approve"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button 
                            onClick={() => handleRejectAppointment(appt.id)}
                            className="btn-reject"
                          >
                            <FaTimes /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-appointments">No {activeTab} appointments found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;