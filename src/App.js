// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./LOGIN/Login";
import Home from "./pages/Home"; // create a dummy Home page
import Signup from "./LOGIN/Signup";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
         <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
