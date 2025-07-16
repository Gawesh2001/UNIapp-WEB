import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { 
  FaUser, FaEnvelope, FaUniversity, 
  FaGraduationCap, FaCalendarAlt, FaHome 
} from "react-icons/fa";
import "./Profile.css";
import UserSession from "../utils/UserSession"; // ✅ Import UserSession

const Profile = () => {
  const navigate = useNavigate();
  const containerRef = useRef();
  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    faculty: "",
    degreeProgram: "",
    batchNumber: ""
  });

  useEffect(() => {
    // ✅ Load user details from UserSession
    const currentUser = UserSession.currentUser;
    setUser({
      name: currentUser.name || "User",
      email: currentUser.email || "No email",
      role: currentUser.role || "Student",
      faculty: currentUser.faculty || "Unknown Faculty",
      degreeProgram: currentUser.degreeProgram || "N/A",
      batchNumber: currentUser.batchNumber || "N/A"
    });

    // ✅ Animate the container and profile cards
    gsap.to(containerRef.current, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        const cards = document.querySelectorAll(".profile-card");
        gsap.from(cards, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out"
        });
      }
    });
  }, []);

  const navigateToHome = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => navigate("/home")
    });
  };

  return (
    <div className="profile-container" ref={containerRef} style={{ opacity: 0 }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img 
            src="https://studyway-resources.s3.amazonaws.com/profilePictures/1669870901417.png" 
            alt="NSBM Logo" 
            className="sidebar-logo"
          />
          <h2>NSBM</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li onClick={navigateToHome}>
              <FaHome className="nav-icon" />
              <span>Home</span>
            </li>
            <li className="active">
              <FaUser className="nav-icon" />
              <span>Profile</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="profile-content">
          <div className="profile-header">
            <div className="avatar">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="profile-info">
              <h1>{user.name}</h1>
              <p className="role">{user.role}</p>
              <p className="faculty">{user.faculty}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-card">
              <div className="card-icon"><FaUser /></div>
              <div className="card-content">
                <h3>Personal Information</h3>
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{user.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-icon"><FaUniversity /></div>
              <div className="card-content">
                <h3>Academic Information</h3>
                <div className="detail-item">
                  <span className="label">Faculty:</span>
                  <span className="value">{user.faculty}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Degree Program:</span>
                  <span className="value">{user.degreeProgram}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Batch Number:</span>
                  <span className="value">{user.batchNumber}</span>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-icon"><FaCalendarAlt /></div>
              <div className="card-content">
                <h3>Academic Progress</h3>
                <div className="progress-item">
                  <span className="label">Current Semester:</span>
                  <span className="value">Semester 2</span>
                </div>
                <div className="progress-item">
                  <span className="label">GPA:</span>
                  <span className="value">3.75</span>
                </div>
                <div className="progress-item">
                  <span className="label">Credits Completed:</span>
                  <span className="value">45/120</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
