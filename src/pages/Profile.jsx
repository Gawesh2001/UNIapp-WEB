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
  FaArrowLeft,
  FaEnvelope,
  FaUniversity,
  FaGraduationCap,
  FaUsers,
  FaCalendarCheck,
  FaCalendarTimes
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
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [selectedModule, setSelectedModule] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [studentAppointments, setStudentAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [processingAppointment, setProcessingAppointment] = useState(null);

  const sendApprovalEmail = async (toEmail, lecturerName, date, time) => {
    try {
      const response = await fetch(
        "https://us-central1-your-project.cloudfunctions.net/sendApprovalEmail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toEmail, lecturerName, date, time }),
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error("Failed to send email");
    } catch (error) {
      console.error("Email error:", error);
      throw error;
    }
  };

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
              const appt = { 
                id: doc.id, 
                ...doc.data(),
                updatedAt: doc.data().updatedAt?.toDate() 
              };
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
              appointmentsData.push({ 
                id: doc.id, 
                ...doc.data(),
                updatedAt: doc.data().updatedAt?.toDate() 
              });
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
      if (!selectedModule) {
        throw new Error('Please select a module');
      }

      const moduleRef = doc(
        db,
        'Faculties',
        currentUser.faculty,
        'Degrees',
        currentUser.degreeProgram,
        'Batches',
        currentUser.batchNumber,
        'Modules',
        selectedModule
      );

      const moduleSnap = await getDoc(moduleRef);
      
      if (!moduleSnap.exists()) {
        throw new Error('Selected module not found');
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
        module: selectedModule,
        date,
        time,
        reason,
        faculty: currentUser.faculty,
        degreeProgram: currentUser.degreeProgram,
        batchNumber: currentUser.batchNumber,
        status: 'Pending',
        lecturerId: lecturerData.uid,
        lecturerName: lecturerData.name,
        lecturerEmail: lecturerData.email,
        createdAt: serverTimestamp(),
        lecturerReply: '',
        studentViewed: false,
        updatedAt: serverTimestamp()
      };
    
      await addDoc(collection(db, 'Appointments'), appointmentData);
      setSuccess(true);
      setDate('');
      setTime('');
      setReason('');
      setSelectedModule('');
      toast.success('Appointment request submitted successfully!');
    } catch (err) {
      console.error('Appointment error:', err);
      setError(err.message || 'Failed to book appointment');
      toast.error(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to approve this appointment?')) return;
    
    try {
      setProcessingAppointment(appointmentId);
      setError(null);
      
      const appointmentRef = doc(db, 'Appointments', appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      const { studentEmail, lecturerName, date, time } = appointmentSnap.data();

      await updateDoc(appointmentRef, {
        status: 'Approved',
        lecturerReply: 'Your appointment has been approved',
        updatedAt: serverTimestamp(),
        studentViewed: false
      });

      await sendApprovalEmail(studentEmail, lecturerName, date, time);
      
      toast.success('Appointment approved and email sent!');
    } catch (err) {
      console.error('Error approving appointment:', err);
      setError('Failed to approve appointment');
      toast.error(err.message || 'Failed to approve appointment');
    } finally {
      setProcessingAppointment(null);
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    const rejectionReason = window.prompt('Please enter the reason for rejection:');
    if (!rejectionReason) return;
    
    try {
      setProcessingAppointment(appointmentId);
      setError(null);
      
      await updateDoc(doc(db, 'Appointments', appointmentId), {
        status: 'Rejected',
        lecturerReply: `Rejected: ${rejectionReason}`,
        updatedAt: serverTimestamp(),
        studentViewed: false
      });
      
      toast.success('Appointment rejected successfully');
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      setError('Failed to reject appointment');
      toast.error(err.message || 'Failed to reject appointment');
    } finally {
      setProcessingAppointment(null);
    }
  };

  const markAsViewed = async (appointmentId) => {
    try {
      await updateDoc(doc(db, 'Appointments', appointmentId), {
        studentViewed: true
      });
      setHasNewNotifications(studentAppointments.some(
        a => !a.studentViewed && a.status !== 'Pending' && a.id !== appointmentId
      ));
    } catch (err) {
      console.error('Error marking as viewed:', err);
      toast.error('Failed to update notification status');
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="profile-header">
        <button 
          onClick={() => navigate(-1)} 
          className="back-button"
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>
          {currentUser.role === 'student' ? (
            <><FaUserGraduate /> Student Profile</>
          ) : (
            <><FaChalkboardTeacher /> Lecturer Profile</>
          )}
        </h1>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="user-card">
            <div className="user-avatar">
              {currentUser.role === 'student' ? (
                <FaUserGraduate size={48} />
              ) : (
                <FaChalkboardTeacher size={48} />
              )}
            </div>
            <h2>{currentUser.name}</h2>
            <p className="user-email"><FaEnvelope /> {currentUser.email}</p>
            <p className="user-role">{currentUser.role}</p>
            
            <div className="user-details">
              {currentUser.faculty && (
                <div className="detail-item">
                  <FaUniversity />
                  <span>{currentUser.faculty}</span>
                </div>
              )}
              {currentUser.degreeProgram && (
                <div className="detail-item">
                  <FaGraduationCap />
                  <span>{currentUser.degreeProgram}</span>
                </div>
              )}
              {currentUser.batchNumber && (
                <div className="detail-item">
                  <FaUsers />
                  <span>Batch {currentUser.batchNumber}</span>
                </div>
              )}
            </div>
          </div>

          {currentUser.role === 'student' && modules.length > 0 && (
            <div className="modules-card">
              <h3><FaBook /> Your Modules</h3>
              <ul className="modules-list">
                {modules.map((module) => (
                  <li key={module}>
                    <FaBook className="module-icon" />
                    <span>{module}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="profile-main">
          {currentUser.role === 'student' ? (
            <>
              <div className="appointments-section">
                <div className="section-header">
                  <h2><FaCalendarAlt /> Your Appointments</h2>
                  {hasNewNotifications && (
                    <span className="notification-badge pulse">
                      <FaBell /> New Response
                    </span>
                  )}
                  <button 
                    onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                    className={`btn ${showAppointmentForm ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {showAppointmentForm ? 'Cancel' : 'Book New Appointment'}
                  </button>
                </div>
                
                {showAppointmentForm && (
                  <div className="appointment-form-container">
                    {success ? (
                      <div className="success-message">
                        <FaCheckCircle size={48} className="success-icon" />
                        <h3>Appointment Booked Successfully!</h3>
                        <p>Your lecturer will respond soon.</p>
                        <button 
                          onClick={() => setSuccess(false)}
                          className="btn btn-primary"
                        >
                          Book Another Appointment
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAppointmentSubmit} className="appointment-form">
                        <h3>New Appointment Request</h3>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label><FaBook /> Module</label>
                            <select
                              value={selectedModule}
                              onChange={(e) => setSelectedModule(e.target.value)}
                              required
                            >
                              <option value="">Select a module</option>
                              {modules.map((module) => (
                                <option key={module} value={module}>
                                  {module}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label><FaCalendarAlt /> Date</label>
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label><FaClock /> Time</label>
                            <input
                              type="time"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              min="09:00"
                              max="17:00"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label><FaInfoCircle /> Reason for Appointment</label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Briefly explain the purpose of this meeting..."
                            required
                            minLength={10}
                            rows={4}
                          />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="btn btn-primary btn-block"
                        >
                          {submitting ? <><FaSpinner className="spinner" /> Submitting...</> : 'Submit Request'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {studentAppointments.length > 0 ? (
                  <div className="appointments-list">
                    {studentAppointments.map((appt) => (
                      <div 
                        key={appt.id} 
                        className={`appointment-card ${appt.status.toLowerCase()} ${
                          !appt.studentViewed && appt.status !== 'Pending' ? 'unread' : ''
                        }`}
                        onClick={() => markAsViewed(appt.id)}
                      >
                        <div className="appointment-header">
                          <div className="appointment-title">
                            <h4>{appt.module}</h4>
                            <p>With {appt.lecturerName}</p>
                          </div>
                          <div className={`appointment-status ${appt.status.toLowerCase()}`}>
                            {appt.status === 'Pending' ? <FaSpinner className="spinner" /> :
                             appt.status === 'Approved' ? <FaCheckCircle /> :
                             <FaTimes />}
                            <span>{appt.status}</span>
                          </div>
                        </div>
                        
                        <div className="appointment-details">
                          <div className="detail-item">
                            <FaCalendarAlt />
                            <span>{formatDate(appt.date)} at {appt.time}</span>
                          </div>
                          <div className="detail-item">
                            <FaInfoCircle />
                            <span>{appt.reason}</span>
                          </div>
                          
                          {appt.status !== 'Pending' && (
                            <>
                              <div className="detail-item response">
                                <FaChalkboardTeacher />
                                <div>
                                  <strong>Lecturer Response:</strong>
                                  <p>{appt.lecturerReply}</p>
                                </div>
                              </div>
                              <div className="response-time">
                                Updated: {formatDateTime(appt.updatedAt)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaCalendarAlt size={48} />
                    <h3>No Appointments Booked</h3>
                    <p>You haven't booked any appointments yet. Click the button above to request one.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="appointments-section">
                <div className="section-header">
                  <h2><FaCalendarAlt /> Appointment Requests</h2>
                  <div className="tabs">
                    <button
                      className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                      onClick={() => setActiveTab('pending')}
                    >
                      <FaCalendarAlt /> Pending
                    </button>
                    <button
                      className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                      onClick={() => setActiveTab('approved')}
                    >
                      <FaCalendarCheck /> Approved
                    </button>
                    <button
                      className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
                      onClick={() => setActiveTab('rejected')}
                    >
                      <FaCalendarTimes /> Rejected
                    </button>
                  </div>
                </div>
                
                {filteredAppointments.length > 0 ? (
                  <div className="appointments-list">
                    {filteredAppointments.map((appt) => (
                      <div key={appt.id} className={`appointment-card ${appt.status.toLowerCase()}`}>
                        <div className="appointment-header">
                          <div className="appointment-title">
                            <h4>{appt.module}</h4>
                            <p>Requested by {appt.studentName}</p>
                          </div>
                          <div className={`appointment-status ${appt.status.toLowerCase()}`}>
                            <span>{appt.status}</span>
                          </div>
                        </div>
                        
                        <div className="appointment-details">
                          <div className="detail-item">
                            <FaUserGraduate />
                            <span>{appt.studentEmail}</span>
                          </div>
                          <div className="detail-item">
                            <FaCalendarAlt />
                            <span>{formatDate(appt.date)} at {appt.time}</span>
                          </div>
                          <div className="detail-item">
                            <FaInfoCircle />
                            <span>{appt.reason}</span>
                          </div>
                          
                          {appt.status !== 'Pending' && (
                            <div className="detail-item response">
                              <FaChalkboardTeacher />
                              <div>
                                <strong>Your Response:</strong>
                                <p>{appt.lecturerReply}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {appt.status === 'Pending' && (
                          <div className="appointment-actions">
                            <button 
                              onClick={() => handleApproveAppointment(appt.id)}
                              disabled={processingAppointment === appt.id}
                              className="btn btn-approve"
                            >
                              {processingAppointment === appt.id ? (
                                <FaSpinner className="spinner" />
                              ) : (
                                <>
                                  <FaCheck /> Approve
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleRejectAppointment(appt.id)}
                              disabled={processingAppointment === appt.id}
                              className="btn btn-reject"
                            >
                              {processingAppointment === appt.id ? (
                                <FaSpinner className="spinner" />
                              ) : (
                                <>
                                  <FaTimes /> Reject
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    {activeTab === 'pending' ? (
                      <>
                        <FaCalendarAlt size={48} />
                        <h3>No Pending Requests</h3>
                        <p>You don't have any pending appointment requests at this time.</p>
                      </>
                    ) : activeTab === 'approved' ? (
                      <>
                        <FaCalendarCheck size={48} />
                        <h3>No Approved Appointments</h3>
                        <p>You haven't approved any appointments yet.</p>
                      </>
                    ) : (
                      <>
                        <FaCalendarTimes size={48} />
                        <h3>No Rejected Appointments</h3>
                        <p>You haven't rejected any appointments yet.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;