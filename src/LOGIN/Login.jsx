import React, { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
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

  // Initial animations on component mount
  useEffect(() => {
    // Immediately hide everything before any rendering can occur
    gsap.set(containerRef.current, { autoAlpha: 0 });
    gsap.set(cardRef.current, { autoAlpha: 0 });
    
    // Set initial positions (off-screen) for all animated elements
    gsap.set([welcomeRef.current, emailRef.current, passwordRef.current], { y: 20, autoAlpha: 0 });
    gsap.set(forgotRef.current, { y: 50, autoAlpha: 0 });
    gsap.set(loginRef.current, { y: 50, autoAlpha: 0 });
    gsap.set(footerRef.current, { y: 30, autoAlpha: 0 });

    // Create a slight delay to ensure everything is properly hidden
    const timer = setTimeout(() => {
      // Make container and card visible
      gsap.to(containerRef.current, { autoAlpha: 1, duration: 0 });
      gsap.to(cardRef.current, { autoAlpha: 1, duration: 0 });

      // Animation timeline
      const tl = gsap.timeline();

      // Welcome message animation (center screen)
      tl.from(welcomeRef.current, {
        duration: 0.8,
        scale: 0.5,
        autoAlpha: 0,
        color: "#000000",
        ease: "back.out(1.7)"
      });

      // Move welcome message up
      tl.to(welcomeRef.current, {
        y: -20,
        autoAlpha: 1,
        duration: 0.6,
        ease: "power2.out"
      });

      // Form elements fly in from left
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

      // Forgot password comes up from bottom
      tl.to(forgotRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, "-=0.3");

      // Login button comes up from bottom
      tl.to(loginRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, "-=0.4");

      // Footer comes up
      tl.to(footerRef.current, {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3");
    }, 50); // Small delay to ensure everything is properly set

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Error message animation
  useEffect(() => {
    if (error) {
      gsap.fromTo(errorRef.current, 
        { y: -20, autoAlpha: 0 }, 
        { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out" }
      );
    }
  }, [error]);

  // Reset modal animation
  useEffect(() => {
    if (isResetOpen) {
      gsap.fromTo(resetModalRef.current, 
        { scale: 0.8, autoAlpha: 0 }, 
        { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out" }
      );
    }
  }, [isResetOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
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
      }
    });
  };

  return (
    <div 
      className="auth-container" 
      ref={containerRef} 
      style={{ 
        visibility: "hidden",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://media.licdn.com/dms/image/v2/C561BAQEOoczaGxpdNg/company-background_10000/company-background_10000/0/1628311829240/human_resource_circle_of_nsbm_green_university_cover?e=2147483647&v=beta&t=lTFSwYGtxTxqdjSKT9gQqSd5BybpeKxa0beuTa-MaV0')`,
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

        {error && <div className="auth-error" ref={errorRef}>{error}</div>}

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