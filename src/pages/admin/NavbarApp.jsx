import { Link } from "react-router-dom";
import "./Navbar.css";

const NavbarApp = () => {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/app/admin_panel/:orgCode">Student</Link>
        <Link to="/app/update-attendance">Attendance</Link>
        <Link to="/app/update-marks">Score</Link>
        <Link to="/app/add-module">Modules</Link>
        <Link to="/app/share_app">Notify</Link>
      </div>
    </nav>
  );
};

export default NavbarApp;
