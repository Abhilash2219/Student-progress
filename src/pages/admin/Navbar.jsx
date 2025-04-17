import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/RegisterStudent">Student</Link>
        <Link to="/update-attendance">Attendance</Link>
        <Link to="/update-marks">Score</Link>
        <Link to="/add-module">Modules</Link>
        <Link to="/share">Notify</Link>
      </div>
    </nav>
  );
};

export default Navbar;
