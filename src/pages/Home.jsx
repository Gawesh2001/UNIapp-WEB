import React, { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FaSignOutAlt,
  FaBell,
  FaCalendarAlt,
  FaBook,
  FaUsers,
  FaChartLine,
  FaUniversity,
  FaSearch,
  FaTimes,
  FaChevronRight,
  FaHome,
  FaUser,
  FaCog,
  FaEnvelope,
  FaUserCircle,
} from "react-icons/fa";
import "./Home.css";
import UserSession from "../utils/UserSession";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const navigate = useNavigate();
  const containerRef = useRef();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    role: "",
    faculty: "",
  });

  // Sample announcements data
  const announcements = {
    special: [
      {
        id: 1,
        title: "University Closure - Special Holiday",
        content:
          "NSBM will remain closed on 2024-06-10 for a special holiday. All academic activities will resume on the following day.",
        date: "2024-05-20",
        type: "special",
        urgent: true,
      },
      {
        id: 2,
        title: "Vice Chancellor's Address",
        content:
          "The Vice Chancellor will address all students on 2024-06-15 at the university auditorium. Attendance is mandatory.",
        date: "2024-05-18",
        type: "special",
        urgent: true,
      },
      {
        id: 3,
        title: "Campus Security Update",
        content:
          "New security measures implemented. All students must carry ID cards at all times starting from 2024-06-01.",
        date: "2024-05-15",
        type: "special",
        urgent: false,
      },
      {
        id: 4,
        title: "COVID-19 Safety Guidelines",
        content:
          "Updated safety guidelines have been published. Please review them on the university portal.",
        date: "2024-05-12",
        type: "special",
        urgent: true,
      },
      {
        id: 5,
        title: "New Student Portal Launch",
        content:
          "The new student portal will be launched on 2024-06-05 with enhanced features.",
        date: "2024-05-10",
        type: "special",
        urgent: false,
      },
    ],
    academic: [
      {
        id: 6,
        title: "Final Exam Schedule Released",
        content:
          "The final examination schedule for Semester 1 2024 has been published. Please check your timetable.",
        date: "2024-05-15",
        type: "academic",
        urgent: true,
      },
      {
        id: 7,
        title: "New Scholarship Opportunities",
        content:
          "Applications are now open for the Green Future Scholarship program. Deadline: 2024-06-15.",
        date: "2024-05-05",
        type: "academic",
        urgent: false,
      },
      {
        id: 8,
        title: "Course Registration Deadline Extended",
        content:
          "The deadline for course registration has been extended to 2024-05-25.",
        date: "2024-05-03",
        type: "academic",
        urgent: false,
      },
      {
        id: 9,
        title: "Library Extended Hours",
        content:
          "During exam period, library will remain open until 10:00 PM from 2024-06-01 to 2024-06-30.",
        date: "2024-05-01",
        type: "academic",
        urgent: false,
      },
      {
        id: 10,
        title: "Academic Calendar Update",
        content:
          "The academic calendar for 2024/2025 has been updated. Please download the latest version.",
        date: "2024-04-28",
        type: "academic",
        urgent: false,
      },
    ],
    event: [
      {
        id: 11,
        title: "Career Fair 2024",
        content:
          "NSBM Annual Career Fair will be held on 2024-06-05. Over 50 companies will be participating.",
        date: "2024-05-08",
        type: "event",
        urgent: true,
      },
      {
        id: 12,
        title: "Sports Week Registration",
        content:
          "Registration for the annual NSBM Sports Week is now open. Events include cricket, football, and more.",
        date: "2024-05-03",
        type: "event",
        urgent: false,
      },
      {
        id: 13,
        title: "Tech Symposium 2024",
        content:
          "Call for papers for the annual Tech Symposium. Submission deadline: 2024-05-20.",
        date: "2024-04-25",
        type: "event",
        urgent: false,
      },
      {
        id: 14,
        title: "Cultural Festival",
        content:
          "NSBM Cultural Festival will be held on 2024-07-10. Performance registrations are now open.",
        date: "2024-04-20",
        type: "event",
        urgent: false,
      },
      {
        id: 15,
        title: "Alumni Meetup",
        content:
          "Annual alumni meetup scheduled for 2024-06-20 at the university premises.",
        date: "2024-04-15",
        type: "event",
        urgent: false,
      },
    ],
    facility: [
      {
        id: 16,
        title: "Campus Maintenance - Library Closed",
        content:
          "The main library will be closed on 2024-05-20 for annual maintenance. E-resources will remain available.",
        date: "2024-05-10",
        type: "facility",
        urgent: false,
      },
      {
        id: 17,
        title: "IT System Upgrade",
        content:
          "The university IT systems will be upgraded this weekend. Some services may be temporarily unavailable.",
        date: "2024-05-01",
        type: "facility",
        urgent: false,
      },
      {
        id: 18,
        title: "New Cafeteria Opening",
        content:
          "The new cafeteria in Block C will open on 2024-05-25 with special discounts for the first week.",
        date: "2024-04-28",
        type: "facility",
        urgent: false,
      },
      {
        id: 19,
        title: "Parking Area Renovation",
        content:
          "The main parking area will be under renovation from 2024-06-01 to 2024-06-15. Alternative parking provided.",
        date: "2024-04-22",
        type: "facility",
        urgent: false,
      },
      {
        id: 20,
        title: "Wi-Fi Upgrade Complete",
        content:
          "The campus Wi-Fi upgrade has been completed with improved coverage and speed.",
        date: "2024-04-18",
        type: "facility",
        urgent: false,
      },
    ],
  };

  useEffect(() => {
    // Load user details from UserSession
    const user = UserSession.currentUser;
    setUserDetails({
      name: user.name || "User",
      email: user.email,
      role: user.role || "Student",
      faculty: user.faculty || "Computing",
    });

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
      } else {
        setIsLoggedIn(true);
      }
    });

    // Initial animation

    // Card animations - will be triggered when they come into view
    gsap.utils.toArray(".announcement-card").forEach((card, i) => {
      gsap.set(card, { opacity: 0, y: 20 });

      ScrollTrigger.create({
        trigger: card,
        start: "top 80%",
        onEnter: () => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: "power2.out",
          });
        },
      });
    });

    return () => {
      unsubscribe();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [navigate]);

  const filterAnnouncements = (announcements) => {
    return announcements.filter((announcement) => {
      return (
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    UserSession.clearUser();
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  const handleBackButton = (e) => {
    if (isLoggedIn) {
      e.preventDefault();
      navigate("/home", { replace: true });
    }
  };

  const navigateToProfile = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => navigate("/profile"),
    });
  };

  useEffect(() => {
    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isLoggedIn]);

  return (
    <div className="dashboard-container" ref={containerRef}>
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
            <li
              className={activeMenu === "home" ? "active" : ""}
              onClick={() => setActiveMenu("home")}
            >
              <FaHome className="nav-icon" />
              <span>Home</span>
            </li>
            <li
              className={activeMenu === "profile" ? "active" : ""}
              onClick={() => {
                setActiveMenu("profile");
                navigateToProfile();
              }}
            >
              <FaUser className="nav-icon" />
              <span>Profile</span>
            </li>
            <li
              className={activeMenu === "messages" ? "active" : ""}
              onClick={() => setActiveMenu("messages")}
            >
              <FaEnvelope className="nav-icon" />
              <span>Messages</span>
            </li>
            <li
              className={activeMenu === "settings" ? "active" : ""}
              onClick={() => setActiveMenu("settings")}
            >
              <FaCog className="nav-icon" />
              <span>Settings</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="user-info">
            <span>Welcome, {userDetails.name}</span>
            <button className="profile-btn" onClick={navigateToProfile}>
              <FaUserCircle className="profile-icon" />
            </button>
          </div>
        </header>

        <NavLink
          to="/chatPage"
          // to={`/group-${userDetails.faculty
          //   .toLowerCase()
          //   .replace(/\s+/g, "-")
          //   .replace(/[()]/g, "")
          //   .replace(/[^a-z0-9-]/g, "")}`}
        >
          <div className="circle">
            {userDetails.faculty
              .trim()
              .split(" ")
              .map((word) => word[0])
              .join("")
              .toUpperCase()}
          </div>
        </NavLink>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <h1 className="dashboard-title">University Announcements</h1>

          {/* Announcement Sections */}
          <section className="announcement-section">
            <div className="section-header">
              <h2>
                <FaBell className="section-icon" />
                Special Announcements
              </h2>
              <a href="#" className="view-all">
                View All
              </a>
            </div>
            <div className="announcements-grid">
              {filterAnnouncements(announcements.special).map(
                (announcement) => (
                  <div
                    className={`announcement-card ${announcement.type} ${
                      announcement.urgent ? "urgent" : ""
                    }`}
                    key={announcement.id}
                  >
                    <div className="card-header">
                      <div className="card-badge">
                        <span>{announcement.type}</span>
                      </div>
                      {announcement.urgent && (
                        <div className="urgent-badge">URGENT</div>
                      )}
                    </div>
                    <div className="card-content">
                      <h3>{announcement.title}</h3>
                      <p>{announcement.content}</p>
                      <div className="card-footer">
                        <span className="date">{announcement.date}</span>
                        <button className="details-btn">
                          View Details{" "}
                          <FaChevronRight className="details-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="announcement-section">
            <div className="section-header">
              <h2>
                <FaBook className="section-icon" />
                Academic Announcements
              </h2>
              <a href="#" className="view-all">
                View All
              </a>
            </div>
            <div className="announcements-grid">
              {filterAnnouncements(announcements.academic).map(
                (announcement) => (
                  <div
                    className={`announcement-card ${announcement.type} ${
                      announcement.urgent ? "urgent" : ""
                    }`}
                    key={announcement.id}
                  >
                    <div className="card-header">
                      <div className="card-badge">
                        <span>{announcement.type}</span>
                      </div>
                      {announcement.urgent && (
                        <div className="urgent-badge">URGENT</div>
                      )}
                    </div>
                    <div className="card-content">
                      <h3>{announcement.title}</h3>
                      <p>{announcement.content}</p>
                      <div className="card-footer">
                        <span className="date">{announcement.date}</span>
                        <button className="details-btn">
                          View Details{" "}
                          <FaChevronRight className="details-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="announcement-section">
            <div className="section-header">
              <h2>
                <FaCalendarAlt className="section-icon" />
                Events
              </h2>
              <a href="#" className="view-all">
                View All
              </a>
            </div>
            <div className="announcements-grid">
              {filterAnnouncements(announcements.event).map((announcement) => (
                <div
                  className={`announcement-card ${announcement.type} ${
                    announcement.urgent ? "urgent" : ""
                  }`}
                  key={announcement.id}
                >
                  <div className="card-header">
                    <div className="card-badge">
                      <span>{announcement.type}</span>
                    </div>
                    {announcement.urgent && (
                      <div className="urgent-badge">URGENT</div>
                    )}
                  </div>
                  <div className="card-content">
                    <h3>{announcement.title}</h3>
                    <p>{announcement.content}</p>
                    <div className="card-footer">
                      <span className="date">{announcement.date}</span>
                      <button className="details-btn">
                        View Details <FaChevronRight className="details-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="announcement-section">
            <div className="section-header">
              <h2>
                <FaUniversity className="section-icon" />
                Facility Updates
              </h2>
              <a href="#" className="view-all">
                View All
              </a>
            </div>
            <div className="announcements-grid">
              {filterAnnouncements(announcements.facility).map(
                (announcement) => (
                  <div
                    className={`announcement-card ${announcement.type} ${
                      announcement.urgent ? "urgent" : ""
                    }`}
                    key={announcement.id}
                  >
                    <div className="card-header">
                      <div className="card-badge">
                        <span>{announcement.type}</span>
                      </div>
                      {announcement.urgent && (
                        <div className="urgent-badge">URGENT</div>
                      )}
                    </div>
                    <div className="card-content">
                      <h3>{announcement.title}</h3>
                      <p>{announcement.content}</p>
                      <div className="card-footer">
                        <span className="date">{announcement.date}</span>
                        <button className="details-btn">
                          View Details{" "}
                          <FaChevronRight className="details-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
