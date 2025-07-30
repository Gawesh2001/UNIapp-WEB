// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./LOGIN/Login";
import Home from "./pages/Home"; // create a dummy Home page
import Signup from "./LOGIN/Signup";
import Profile from "./pages/Profile";
import ChatPageWrapper from "./components/ChatPageWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ModulePages from "./pages/ModulePage";
import QnAPage from "./pages/QnAPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chatPage" element={<ChatPageWrapper />} />
        <Route path="/modules/:moduleId" element={<ModulePages />} />
        <Route path="/qna" element={<QnAPage />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </Router>
  );
}

export default App;
