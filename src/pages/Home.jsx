import React, { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { collection, getDocs } from "firebase/firestore";
import {
  FaSignOutAlt,
  FaBell,
  FaCalendarAlt,
  FaBook,
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
  const [announcements, setAnnouncements] = useState({
    special: [],
    academic: [],
    event: [],
    facility: []
  });
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    role: "",
    faculty: "",
    degreeProgram: "",
    batchNumber: "",
  });

  const getInitials = (text) =>
    text
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        const fetchedAnnouncements = {
          special: [],
          academic: [],
          event: [],
          facility: []
        };

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const announcement = {
            id: doc.id,
            title: data.title,
            content: data.message,
            date: data.createdAt?.toDate().toISOString().split('T')[0] || "N/A",
            type: data.category.toLowerCase(),
            urgent: data.isUrgent || false,
            createdBy: data.createdBy || "Admin"
          };

          switch(data.category.toLowerCase()) {
            case "special announcements":
              fetchedAnnouncements.special.push(announcement);
              break;
            case "academic announcements":
              fetchedAnnouncements.academic.push(announcement);
              break;
            case "events":
              fetchedAnnouncements.event.push(announcement);
              break;
            case "facility updates":
              fetchedAnnouncements.facility.push(announcement);
              break;
            default:
              break;
          }
        });

        setAnnouncements(fetchedAnnouncements);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const user = UserSession.currentUser;
    setUserDetails({
      name: user.name || "User",
      email: user.email,
      role: user.role || "Student",
      faculty: user.faculty || "Computing",
      degreeProgram: user.degreeProgram,
      batchNumber: user.batchNumber || "23.2",
    });

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
      } else {
        setIsLoggedIn(true);
      }
    });

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
  }, [navigate, announcements]);

  const filterAnnouncements = (announcements) => {
    return announcements.filter((announcement) => {
      return (
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* University Header */}
      <div className="university-header">
        <div className="university-logo-container">
          <img
            src="https://studyway-resources.s3.amazonaws.com/profilePictures/1669870901417.png"
            alt="NSBM Logo"
            className="university-logo"
          />
          <div className="university-text">
            <h1>NSBM Green University</h1>
            <p className="welcome-text">Welcome to the University Portal</p>
          </div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="top-nav-bar">
        <div className="nav-container">
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
          <div className="logout-container" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-content">
            <div className="search-container">
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
            </div>

            <div className="user-info">
              <div className="user-greeting">
                <span>Welcome back,</span>
                <span className="user-name">{userDetails.name}</span>
              </div>
              <button className="profile-btn" onClick={navigateToProfile}>
                <FaUserCircle className="profile-icon" />
              </button>
            </div>
          </div>
        </header>

        <div className="content-container">
          {/* Chat Groups */}
          <div className="chat-groups-container">
            <h2 className="chat-groups-title">Your Communities</h2>
            <div className="chat-groups">
              {userDetails?.faculty && (
                <NavLink
                  to="/chatPage"
                  state={{
                    chatPath: ["Faculties", userDetails.faculty, "chat"],
                    title: userDetails.faculty,
                    userFilter: [{ field: "faculty", value: userDetails.faculty }],
                  }}
                >
                  <div className="chat-group-card faculty">
                    <div className="chat-group-initials">{getInitials(userDetails.faculty)}</div>
                    <div className="chat-group-name">{userDetails.faculty}</div>
                  </div>
                </NavLink>
              )}

              {userDetails?.faculty && userDetails?.degreeProgram && (
                <NavLink
                  to="/chatPage"
                  state={{
                    chatPath: [
                      "Faculties",
                      userDetails.faculty,
                      "Degrees",
                      userDetails.degreeProgram,
                      "chat",
                    ],
                    title: userDetails.degreeProgram,
                    userFilter: [
                      { field: "degreeProgram", value: userDetails.degreeProgram },
                    ],
                  }}
                >
                  <div className="chat-group-card degree">
                    <div className="chat-group-initials">
                      {getInitials(
                        userDetails.degreeProgram.replace(/^BSc\s*\(Hons\)\s*/i, "")
                      )}
                    </div>
                    <div className="chat-group-name">
                      {userDetails.degreeProgram.replace(/^BSc\s*\(Hons\)\s*/i, "")}
                    </div>
                  </div>
                </NavLink>
              )}

              {userDetails?.faculty &&
                userDetails?.degreeProgram &&
                userDetails?.batchNumber && (
                  <NavLink
                    to="/chatPage"
                    state={{
                      chatPath: [
                        "Faculties",
                        userDetails.faculty,
                        "Degrees",
                        userDetails.degreeProgram,
                        "Batches",
                        userDetails.batchNumber,
                        "chat",
                      ],
                      title: userDetails.batchNumber,
                      userFilter: [
                        { field: "batchNumber", value: userDetails.batchNumber },
                      ],
                    }}
                  >
                    <div className="chat-group-card batch">
                      <div className="chat-group-initials">{userDetails.batchNumber}</div>
                      <div className="chat-group-name">Batch {userDetails.batchNumber}</div>
                    </div>
                  </NavLink>
                )}
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="dashboard-content">
            <h1 className="dashboard-title">University Announcements</h1>

            {loading ? (
              <div className="loading-announcements">
                <div className="loading-spinner"></div>
                <p>Loading announcements...</p>
              </div>
            ) : (
              <>
                {/* Announcement Sections */}
                <section className="announcement-section">
                  <div className="section-header">
                    <h2>
                      <FaBell className="section-icon" />
                      Special Announcements
                    </h2>
                    <a href="#" className="view-all">
                      View All <FaChevronRight className="view-all-icon" />
                    </a>
                  </div>
                  {announcements.special.length === 0 ? (
                    <div className="no-announcements">
                      <p>No special announcements found</p>
                    </div>
                  ) : (
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
                                <div>
                                  <span className="date">{announcement.date}</span>
                                  <p className="created-by">Posted by: {announcement.createdBy}</p>
                                </div>
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
                  )}
                </section>

                <section className="announcement-section">
                  <div className="section-header">
                    <h2>
                      <FaBook className="section-icon" />
                      Academic Announcements
                    </h2>
                    <a href="#" className="view-all">
                      View All <FaChevronRight className="view-all-icon" />
                    </a>
                  </div>
                  {announcements.academic.length === 0 ? (
                    <div className="no-announcements">
                      <p>No academic announcements found</p>
                    </div>
                  ) : (
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
                                <div>
                                  <span className="date">{announcement.date}</span>
                                  <p className="created-by">Posted by: {announcement.createdBy}</p>
                                </div>
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
                  )}
                </section>

                <section className="announcement-section">
                  <div className="section-header">
                    <h2>
                      <FaCalendarAlt className="section-icon" />
                      Events
                    </h2>
                    <a href="#" className="view-all">
                      View All <FaChevronRight className="view-all-icon" />
                    </a>
                  </div>
                  {announcements.event.length === 0 ? (
                    <div className="no-announcements">
                      <p>No events found</p>
                    </div>
                  ) : (
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
                              <div>
                                <span className="date">{announcement.date}</span>
                                <p className="created-by">Posted by: {announcement.createdBy}</p>
                              </div>
                              <button className="details-btn">
                                View Details <FaChevronRight className="details-icon" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="announcement-section">
                  <div className="section-header">
                    <h2>
                      <FaUniversity className="section-icon" />
                      Facility Updates
                    </h2>
                    <a href="#" className="view-all">
                      View All <FaChevronRight className="view-all-icon" />
                    </a>
                  </div>
                  {announcements.facility.length === 0 ? (
                    <div className="no-announcements">
                      <p>No facility updates found</p>
                    </div>
                  ) : (
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
                                <div>
                                  <span className="date">{announcement.date}</span>
                                  <p className="created-by">Posted by: {announcement.createdBy}</p>
                                </div>
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
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;