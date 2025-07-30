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
  FaUserCircle,
  FaTimesCircle,
  FaCommentAlt,
  FaEllipsisH
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
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

  const openAnnouncementDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    document.body.style.overflow = "hidden";
  };

  const closeAnnouncementDetails = () => {
    setSelectedAnnouncement(null);
    document.body.style.overflow = "auto";
  };

  useEffect(() => {
    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isLoggedIn]);

  return (
    <div className="dashboard-container" ref={containerRef}>
      {/* Announcement Details Popup */}
      {selectedAnnouncement && (
        <div className="announcement-modal">
          <div className="modal-overlay" onClick={closeAnnouncementDetails}></div>
          <div className="modal-content">
            <button className="modal-close" onClick={closeAnnouncementDetails}>
              <FaTimesCircle />
            </button>
            <div className={`modal-header ${selectedAnnouncement.type.replace(/\s+/g, '-')}`}>
              <div className="header-badge">
                <span>{selectedAnnouncement.type}</span>
                {selectedAnnouncement.urgent && <span className="urgent-badge">URGENT</span>}
              </div>
              <h2>{selectedAnnouncement.title}</h2>
              <div className="header-meta">
                <span className="meta-date">{selectedAnnouncement.date}</span>
                <span className="meta-author">Posted by {selectedAnnouncement.createdBy}</span>
              </div>
            </div>
            <div className="modal-body">
              <p>{selectedAnnouncement.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="university-logo">
            <img 
              src="https://studyway-resources.s3.amazonaws.com/profilePictures/1669870901417.png" 
              alt="NSBM Logo" 
            />
          </div>
          <h1>NSBM Portal</h1>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li 
              className={activeMenu === "home" ? "active" : ""}
              onClick={() => setActiveMenu("home")}
            >
              <div className="nav-item-content">
                <FaHome className="nav-icon" />
                <span>Home</span>
              </div>
              <div className="active-indicator"></div>
            </li>
            <li 
              className={activeMenu === "profile" ? "active" : ""}
              onClick={() => {
                setActiveMenu("profile");
                navigateToProfile();
              }}
            >
              <div className="nav-item-content">
                <FaUser className="nav-icon" />
                <span>Profile</span>
              </div>
              <div className="active-indicator"></div>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-mini-profile">
            {/* <div className="user-avatar">
              {userDetails.name ? getInitials(userDetails.name) : <FaUserCircle />}
            </div> */}
            <div className="user-info">
              <span className="username">{userDetails.name}</span>
              <span className="user-role">{userDetails.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Navigation */}
        <header className="main-header">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery("")}>
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="header-actions">
            <button className="notification-btn">
              <FaBell />
              <span className="notification-badge">3</span>
            </button>
            <button className="profile-btn" onClick={navigateToProfile}>
              <div className="profile-avatar">
                {userDetails.name ? getInitials(userDetails.name) : <FaUserCircle />}
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-content">
              <h2>Welcome back, {userDetails.name}!</h2>
              <p>Here's what's happening at NSBM today</p>
            </div>
            <div className="banner-pattern"></div>
          </div>

          {/* Communities Section */}
          <section className="communities-section">
            <div className="section-header">
              <h2>
                <FaCommentAlt className="section-icon" />
                Your Communities
              </h2>
              <button className="section-more">
                <FaEllipsisH />
              </button>
            </div>
            
            <div className="communities-grid">
              {userDetails?.faculty && (
                <NavLink
                  to="/chatPage"
                  state={{
                    chatPath: ["Faculties", userDetails.faculty, "chat"],
                    title: userDetails.faculty,
                    userFilter: [{ field: "faculty", value: userDetails.faculty }],
                  }}
                  className="community-card faculty"
                >
                  <div className="card-bg"></div>
                  <div className="card-initials">{getInitials(userDetails.faculty)}</div>
                  <div className="card-content">
                    <h3>{userDetails.faculty}</h3>
                    <p>Faculty Community</p>
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
                  className="community-card degree"
                >
                  <div className="card-bg"></div>
                  <div className="card-initials">
                    {getInitials(userDetails.degreeProgram.replace(/^BSc\s*\(Hons\)\s*/i, ""))}
                  </div>
                  <div className="card-content">
                    <h3>{userDetails.degreeProgram.replace(/^BSc\s*\(Hons\)\s*/i, "")}</h3>
                    <p>Degree Program</p>
                  </div>
                </NavLink>
              )}

              {userDetails?.faculty && userDetails?.degreeProgram && userDetails?.batchNumber && (
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
                  className="community-card batch"
                >
                  <div className="card-bg"></div>
                  <div className="card-initials">{userDetails.batchNumber}</div>
                  <div className="card-content">
                    <h3>Batch {userDetails.batchNumber}</h3>
                    <p>Batch Community</p>
                  </div>
                </NavLink>
              )}
            </div>
          </section>

          {/* Announcements Section */}
          <section className="announcements-section">
            <div className="section-header">
              <h2>
                <FaBell className="section-icon" />
                University Announcements
              </h2>
              <button className="section-more">
                <FaEllipsisH />
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading announcements...</p>
              </div>
            ) : (
              <>
                {/* Special Announcements */}
                <div className="announcement-category">
                  <h3 className="category-title">
                    <FaBell />
                    Special Announcements
                  </h3>
                  <div className="announcements-grid">
                    {filterAnnouncements(announcements.special).map(announcement => (
                      <div 
                        key={announcement.id} 
                        className="announcement-card special"
                        onClick={() => openAnnouncementDetails(announcement)}
                      >
                        <div className="card-corner"></div>
                        <div className="card-header">
                          <span className="card-badge">Special</span>
                          {announcement.urgent && <span className="urgent-tag">URGENT</span>}
                        </div>
                        <div className="card-body">
                          <h4>{announcement.title}</h4>
                          <p>{announcement.content.substring(0, 120)}...</p>
                        </div>
                        <div className="card-footer">
                          <span className="date">{announcement.date}</span>
                          <span className="author">{announcement.createdBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic Announcements */}
                <div className="announcement-category">
                  <h3 className="category-title">
                    <FaBook />
                    Academic Announcements
                  </h3>
                  <div className="announcements-grid">
                    {filterAnnouncements(announcements.academic).map(announcement => (
                      <div 
                        key={announcement.id} 
                        className="announcement-card academic"
                        onClick={() => openAnnouncementDetails(announcement)}
                      >
                        <div className="card-corner"></div>
                        <div className="card-header">
                          <span className="card-badge">Academic</span>
                          {announcement.urgent && <span className="urgent-tag">URGENT</span>}
                        </div>
                        <div className="card-body">
                          <h4>{announcement.title}</h4>
                          <p>{announcement.content.substring(0, 120)}...</p>
                        </div>
                        <div className="card-footer">
                          <span className="date">{announcement.date}</span>
                          <span className="author">{announcement.createdBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events */}
                <div className="announcement-category">
                  <h3 className="category-title">
                    <FaCalendarAlt />
                    Events
                  </h3>
                  <div className="announcements-grid">
                    {filterAnnouncements(announcements.event).map(announcement => (
                      <div 
                        key={announcement.id} 
                        className="announcement-card event"
                        onClick={() => openAnnouncementDetails(announcement)}
                      >
                        <div className="card-corner"></div>
                        <div className="card-header">
                          <span className="card-badge">Event</span>
                          {announcement.urgent && <span className="urgent-tag">URGENT</span>}
                        </div>
                        <div className="card-body">
                          <h4>{announcement.title}</h4>
                          <p>{announcement.content.substring(0, 120)}...</p>
                        </div>
                        <div className="card-footer">
                          <span className="date">{announcement.date}</span>
                          <span className="author">{announcement.createdBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facility Updates */}
                <div className="announcement-category">
                  <h3 className="category-title">
                    <FaUniversity />
                    Facility Updates
                  </h3>
                  <div className="announcements-grid">
                    {filterAnnouncements(announcements.facility).map(announcement => (
                      <div 
                        key={announcement.id} 
                        className="announcement-card facility"
                        onClick={() => openAnnouncementDetails(announcement)}
                      >
                        <div className="card-corner"></div>
                        <div className="card-header">
                          <span className="card-badge">Facility</span>
                          {announcement.urgent && <span className="urgent-tag">URGENT</span>}
                        </div>
                        <div className="card-body">
                          <h4>{announcement.title}</h4>
                          <p>{announcement.content.substring(0, 120)}...</p>
                        </div>
                        <div className="card-footer">
                          <span className="date">{announcement.date}</span>
                          <span className="author">{announcement.createdBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;