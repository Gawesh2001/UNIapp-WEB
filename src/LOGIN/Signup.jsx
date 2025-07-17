import React, { useState, useEffect, useRef } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaEye, 
  FaEyeSlash, 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaUniversity, 
  FaBook, 
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaCalendarAlt
} from "react-icons/fa";
import { gsap } from "gsap";
import "./Auth.css";

const backgroundImage = "https://scontent.fcmb1-2.fna.fbcdn.net/v/t1.6435-9/65319199_3549599095134407_2355776629709471744_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHHlNnhXIiJoMbdeyhauAtUFzIH4sTJ_J0XMgfixMn8nYlxUSnI0-2ZZQqvZiLIvgqbguap__X9MnW7JbKreyf9&_nc_ohc=8J7DBs57i1AQ7kNvwEQTCkM&_nc_oc=AdnpRBvpelXpOCm3BDJ7t-fN9lAIIF-fgTmN3yxJ6lBq9H-AexqhONSuix_nY_5O_7w&_nc_zt=23&_nc_ht=scontent.fcmb1-2.fna&_nc_gid=I7Ny5DybvihemwNFvyT59Q&oh=00_AfQDtcPH4piG1rFTC0GLg8yGYwY78wWVM3YAk3MFT52_ww&oe=689D6555";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState("student");
  const [faculty, setFaculty] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [userCredential, setUserCredential] = useState(null);
  const navigate = useNavigate();

  // Refs for GSAP animations
  const containerRef = useRef();
  const cardRef = useRef();
  const welcomeRef = useRef();
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmRef = useRef();
  const batchRef = useRef();
  const roleRef = useRef();
  const facultyRef = useRef();
  const degreeRef = useRef();
  const signupRef = useRef();
  const footerRef = useRef();
  const errorRef = useRef();
  const successRef = useRef();

  // Initial animations on component mount
  useEffect(() => {
    // Set initial positions (off-screen)
    gsap.set([nameRef.current, emailRef.current], { x: -100, opacity: 0 });
    gsap.set([passwordRef.current, confirmRef.current, batchRef.current], { x: 100, opacity: 0 });
    gsap.set([roleRef.current, facultyRef.current, degreeRef.current], { y: 30, opacity: 0 });
    gsap.set(signupRef.current, { y: 50, opacity: 0 });
    gsap.set(footerRef.current, { y: 30, opacity: 0 });

    // Animation timeline
    const tl = gsap.timeline();

    // Welcome message animation (center screen)
    tl.from(welcomeRef.current, {
      duration: 0.8,
      scale: 0.5,
      opacity: 1,
      color: "#000000",
      ease: "back.out(1.7)"
    });

    // Move welcome message up
    tl.to(welcomeRef.current, {
      y: -40,
      duration: 0.6,
      opacity: 1,
      color: "#000000",
      ease: "power2.out"
    });

    // Form elements fly in from sides
    tl.to(nameRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3");

    tl.to(emailRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4");

    tl.to(passwordRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3");

    tl.to(confirmRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4");

    tl.to(batchRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3");

    // Role, faculty, and degree program fields
    tl.to(roleRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3");

    tl.to(facultyRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4");

    tl.to(degreeRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3");

    // Signup button comes up from bottom
    tl.to(signupRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "back.out(1.7)"
    }, "-=0.3");

    // Footer comes up
    tl.to(footerRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4");
  }, []);

  // Error message animation
  useEffect(() => {
    if (error) {
      gsap.fromTo(errorRef.current, 
        { y: -20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out" }
      );
    }
  }, [error]);

  // Success message animation
  useEffect(() => {
    if (success) {
      gsap.fromTo(successRef.current, 
        { y: -20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out" }
      );
    }
  }, [success]);

  const validateEmailDomain = (email, selectedRole) => {
    const domain = email.split('@')[1] || '';
    
    // Check if email ends with nsbm.ac.lk
    if (!domain.endsWith('nsbm.ac.lk') ) {
      return { valid: false, error: "Please use your NSBM email address (@nsbm.ac.lk)" };
    }
    
    // Check role-specific domain
    if (selectedRole === "student" && !domain.includes('students')) {
      return { valid: false, error: "Student email must contain 'students' in the domain" };
    }
    
      if (selectedRole === "staff" && !domain.includes('staff')) {
      return { valid: false, error: "Staff email must contain 'staff' in the domain" };
     }
    
    return { valid: true };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!name || !email || !password || !confirmPassword || !role || 
        (role === "student" && (!faculty || !degreeProgram || !batchNumber))) {
      setError("Please fill all required fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    // Validate email domain
    const domainValidation = validateEmailDomain(email, role);
    if (!domainValidation.valid) {
      setError(domainValidation.error);
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      setUserCredential(credential);
      
      // Send verification email
      await sendEmailVerification(credential.user);
      
      setVerificationSent(true);
      setSuccess("Verification email sent! Please check your inbox to verify your email.");
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleContinueToLogin = async () => {
    setIsLoading(true);
    try {
      // Check if email is verified
      await auth.currentUser.reload();
      const user = auth.currentUser;
      
      if (!user.emailVerified) {
        setError("Email not verified yet. Please check your inbox and verify your email first.");
        setIsLoading(false);
        return;
      }

      // Save user data to Firestore with emailVerified: true
      const userData = {
        uid: user.uid,
        name,
        email,
        role,
        batchNumber: role === "student" ? batchNumber : null,
        faculty: role === "student" ? faculty : null,
        degreeProgram: role === "student" ? degreeProgram : null,
        emailVerified: true, // Set to true since they've verified
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(doc(db, "UserDetails", user.uid), userData);
      
      // Animation before navigation
      const tl = gsap.timeline();
      tl.to(cardRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.6,
        ease: "power2.in"
      });
      tl.to(containerRef.current, {
        backgroundColor: "#4BB543",
        duration: 0.8,
        onComplete: () => navigate("/login")
      }, "-=0.4");
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    gsap.to(document.querySelectorAll('.password-toggle')[0], {
      scale: 1.2,
      duration: 0.2,
      yoyo: true,
      repeat: 1
    });
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    gsap.to(document.querySelectorAll('.password-toggle')[1], {
      scale: 1.2,
      duration: 0.2,
      yoyo: true,
      repeat: 1
    });
  };

  return (
    <div 
      className="auth-container" 
      ref={containerRef}
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="auth-overlay"></div>
      <div className="auth-card" ref={cardRef}>
        <div className="auth-header" ref={welcomeRef}>
          <h2>Create Account</h2>
          <p>Join us today to get started</p>
        </div>

        {error && (
          <div className="auth-error" ref={errorRef}>
            <FaExclamationCircle className="message-icon" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-success" ref={successRef}>
            <FaCheckCircle className="message-icon" />
            <span>{success}</span>
          </div>
        )}

        {!verificationSent ? (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="input-group" ref={nameRef}>
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group" ref={emailRef}>
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="NSBM Email (students.nsbm.ac.lk or staff.nsbm.ac.lk)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group" ref={passwordRef}>
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="input-group" ref={confirmRef}>
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {role === "student" && (
              <div className="input-group" ref={batchRef}>
                <FaCalendarAlt className="input-icon" />
                <input
                  type="text"
                  placeholder="Batch Number (e.g., NSBM2021)"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required={role === "student"}
                />
              </div>
            )}

            <div className="role-selection" ref={roleRef}>
              <div className="role-label">
                <FaInfoCircle className="section-icon" />
                <span>Select Role</span>
              </div>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === "student"}
                    onChange={() => setRole("student")}
                    required
                  />
                  <div className="radio-content">
                    <FaGraduationCap className="role-icon" />
                    <span>Student</span>
                  </div>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={role === "staff"}
                    onChange={() => setRole("staff")}
                    required
                  />
                  <div className="radio-content">
                    <FaChalkboardTeacher className="role-icon" />
                    <span>Staff</span>
                  </div>
                </label>
              </div>
            </div>

            {role === "student" && (
              <div className="input-group" ref={facultyRef}>
                <FaUniversity className="input-icon" />
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  required
                >
                  <option value="">Select Faculty</option>
                  <option value="Computing">Faculty of Computing</option>
                  <option value="Business">Faculty of Business</option>
                  <option value="Engineering">Faculty of Engineering</option>
                  <option value="Science">Faculty of Science</option>
                </select>
              </div>
            )}

            <div className="input-group" ref={degreeRef}>
              <FaBook className="input-icon" />
              <select
                value={degreeProgram}
                onChange={(e) => setDegreeProgram(e.target.value)}
                required={role === "student"}
              >
                <option value="">
                  {role === "student" ? "Select Degree Program" : "Select Degree Program (Optional)"}
                </option>
                {(role === "student" ? faculty === "Computing" : true) && (
                  <>
                    <option value="BSc (Hons) Computer Science">BSc (Hons) Computer Science</option>
                    <option value="BSc (Hons) Software Engineering">BSc (Hons) Software Engineering</option>
                    <option value="BSc (Hons) Cyber Security">BSc (Hons) Cyber Security</option>
                  </>
                )}
                {(role === "student" ? faculty === "Business" : true) && (
                  <>
                    <option value="BBA (Hons) Business Administration">BBA (Hons) Business Administration</option>
                    <option value="BSc (Hons) Accounting & Finance">BSc (Hons) Accounting & Finance</option>
                  </>
                )}
                {(role === "student" ? faculty === "Engineering" : true) && (
                  <>
                    <option value="BSc (Hons) Electrical & Electronic Engineering">BSc (Hons) Electrical & Electronic Engineering</option>
                    <option value="BSc (Hons) Mechanical Engineering">BSc (Hons) Mechanical Engineering</option>
                  </>
                )}
                {(role === "student" ? faculty === "Science" : true) && (
                  <>
                    <option value="BSc (Hons) Biotechnology">BSc (Hons) Biotechnology</option>
                    <option value="BSc (Hons) Psychology">BSc (Hons) Psychology</option>
                  </>
                )}
              </select>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
              ref={signupRef}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className="auth-footer" ref={footerRef}>
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </form>
        ) : (
          <div className="verification-instructions">
            <h3>Almost there!</h3>
            <div className="verification-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Check your email</strong>
                  <p>We've sent a verification email to <strong>{email}</strong></p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Click the verification link</strong>
                  <p>Open the email and click the verification link inside</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Complete your registration</strong>
                  <p>Once verified, click the button below to continue</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleContinueToLogin}
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Continue to Login'}
            </button>

            <div className="auth-footer" ref={footerRef}>
              Didn't receive the email? <button 
                className="resend-link" 
                onClick={handleSignup}
                disabled={isLoading}
              >
                Resend verification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;