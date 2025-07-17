import React, { useState, useEffect, useRef } from "react";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification 
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import UserSession from "../utils/UserSession";
import { gsap } from "gsap";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();

  // Refs for GSAP animations
  const containerRef = useRef();
  const cardRef = useRef();
  const welcomeRef = useRef();
  const formRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const forgotRef = useRef();
  const loginRef = useRef();
  const footerRef = useRef();
  const errorRef = useRef();
  const resetModalRef = useRef();
  const verificationRef = useRef();

  // Initial animations on component mount
  useEffect(() => {
    gsap.set(containerRef.current, { autoAlpha: 0 });
    gsap.set(cardRef.current, { autoAlpha: 0 });
    
    gsap.set([welcomeRef.current, emailRef.current, passwordRef.current], { y: 20, autoAlpha: 0 });
    gsap.set(forgotRef.current, { y: 50, autoAlpha: 0 });
    gsap.set(loginRef.current, { y: 50, autoAlpha: 0 });
    gsap.set(footerRef.current, { y: 30, autoAlpha: 0 });

    const timer = setTimeout(() => {
      gsap.to(containerRef.current, { autoAlpha: 1, duration: 0 });
      gsap.to(cardRef.current, { autoAlpha: 1, duration: 0 });

      const tl = gsap.timeline();

      tl.from(welcomeRef.current, {
        duration: 0.8,
        scale: 0.5,
        autoAlpha: 0,
        color: "#000000",
        ease: "back.out(1.7)"
      });

      tl.to(welcomeRef.current, {
        y: -20,
        autoAlpha: 1,
        duration: 0.6,
        ease: "power2.out"
      });

      tl.to(emailRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3");

      tl.to(passwordRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.4");

      tl.to(forgotRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, "-=0.3");

      tl.to(loginRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, "-=0.4");

      tl.to(footerRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3");
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (error) {
      gsap.fromTo(errorRef.current, 
        { y: -20, autoAlpha: 0 }, 
        { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out" }
      );
    }
  }, [error]);

  useEffect(() => {
    if (isResetOpen) {
      gsap.fromTo(resetModalRef.current, 
        { scale: 0.8, autoAlpha: 0 }, 
        { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out" }
      );
    }
  }, [isResetOpen]);

  useEffect(() => {
    if (verificationSent) {
      gsap.fromTo(verificationRef.current, 
        { y: -20, autoAlpha: 0 }, 
        { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out" }
      );
    }
  }, [verificationSent]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setVerificationSent(false);
    setNeedsVerification(false);

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified in Firebase Auth
      if (!user.emailVerified) {
        setNeedsVerification(true);
        setError("Please verify your email address before logging in.");
        setIsLoading(false);
        return;
      }

      // Get user document directly by UID
      const userDocRef = doc(db, "UserDetails", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check if email is verified in Firestore (additional check)
        if (userData.emailVerified !== true) {
          setNeedsVerification(true);
          setError("Please verify your email address before logging in.");
          setIsLoading(false);
          return;
        }

        // Save user data in UserSession
        UserSession.setUser({
          batchNumber: userData.batchNumber || "",
          degreeProgram: userData.degreeProgram || "",
          email: userData.email || user.email,
          faculty: userData.faculty || "",
          name: userData.name || "",
          role: userData.role || "",
          uid: user.uid,
        });

        console.log("User session stored:", UserSession);

        // Exit animation before navigation
        const tl = gsap.timeline();
        tl.to(cardRef.current, {
          y: -50,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.in"
        });
        tl.to(containerRef.current, {
          backgroundColor: "#000000",
          duration: 0.8,
          onComplete: () => navigate("/home")
        }, "-=0.4");
      } else {
        setError("User details not found. Please contact support.");
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setVerificationSent(true);
        setError("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email");
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    gsap.to(document.querySelector('.password-toggle'), {
      scale: 1.2,
      duration: 0.2,
      yoyo: true,
      repeat: 1
    });
  };

  const closeResetModal = () => {
    gsap.to(resetModalRef.current, {
      scale: 0.8,
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setIsResetOpen(false);
        setResetSent(false);
        setResetEmail("");
      }
    });
  };

  return (
    <div 
      className="auth-container" 
      ref={containerRef} 
      style={{ 
        visibility: "hidden",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://scontent.fcmb1-2.fna.fbcdn.net/v/t1.6435-9/65319199_3549599095134407_2355776629709471744_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHHlNnhXIiJoMbdeyhauAtUFzIH4sTJ_J0XMgfixMn8nYlxUSnI0-2ZZQqvZiLIvgqbguap__X9MnW7JbKreyf9&_nc_ohc=8J7DBs57i1AQ7kNvwEQTCkM&_nc_oc=AdnpRBvpelXpOCm3BDJ7t-fN9lAIIF-fgTmN3yxJ6lBq9H-AexqhONSuix_nY_5O_7w&_nc_zt=23&_nc_ht=scontent.fcmb1-2.fna&_nc_gid=I7Ny5DybvihemwNFvyT59Q&oh=00_AfQDtcPH4piG1rFTC0GLg8yGYwY78wWVM3YAk3MFT52_ww&oe=689D6555')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="auth-card" ref={cardRef}>
        <div className="auth-header" ref={welcomeRef}>
          <h2>Welcome Back</h2>
          <p>Please enter your credentials to login</p>
        </div>

        {error && <div className="auth-error" ref={errorRef}>
          {error === "Please verify your email address before logging in." ? (
            <FaExclamationCircle style={{ marginRight: "8px" }} />
          ) : null}
          {error}
        </div>}

        {verificationSent && (
          <div className="auth-success" ref={verificationRef}>
            <FaCheckCircle style={{ marginRight: "8px" }} />
            Verification email sent! Please check your inbox.
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form" ref={formRef}>
          <div className="input-group" ref={emailRef}>
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email"
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
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="auth-options" ref={forgotRef}>
            <button 
              type="button" 
              className="text-button"
              onClick={() => setIsResetOpen(true)}
            >
              Forgot password?
            </button>
          </div>

          {needsVerification && (
            <button 
              type="button" 
              className="auth-button secondary"
              onClick={handleSendVerification}
              style={{ marginBottom: "10px" }}
            >
              Resend Verification Email
            </button>
          )}

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={isLoading}
            ref={loginRef}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="auth-footer" ref={footerRef}>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </form>

        {isResetOpen && (
          <div className="reset-modal">
            <div className="reset-content" ref={resetModalRef}>
              <h3>Reset Password</h3>
              {resetSent ? (
                <>
                  <p>Password reset email sent to {resetEmail}</p>
                  <button 
                    className="auth-button" 
                    onClick={closeResetModal}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <p>Enter your email to receive a password reset link</p>
                  <div className="input-group">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="reset-actions">
                    <button 
                      type="button" 
                      className="auth-button secondary"
                      onClick={closeResetModal}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="auth-button primary"
                      onClick={handlePasswordReset}
                    >
                      Send Reset Link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;