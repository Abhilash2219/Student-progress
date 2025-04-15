import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-title">
      <img src={logo} alt="Logo" className="navbar-logo" />
      </div>
      <div className="navbar-links">
        <Link to="/cpanel">New Student</Link>
        <Link to="/update-attendance">Update Attendance</Link>
        <Link to="/update-marks">Update Marks</Link>
        <Link to="/add-module">Add Modules</Link>
        <Link to="/share">Share via Email</Link>
        <Link to="/">Logout</Link>

      </div>
    </nav>
  );
};

export default Navbar;
