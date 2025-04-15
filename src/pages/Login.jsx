import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Login.css";

const LoginPage = () => {
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [selectedLoginType, setSelectedLoginType] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const savedCode = localStorage.getItem("companyCode");
    if (savedCode) setCompanyCode(savedCode);
  }, []);

  const handleLogin = async () => {
    setError("");

    if (selectedLoginType === "student") {
      if (!companyCode.trim() || !studentId.trim()) {
        setError("Please enter both Company Code and Student ID");
        return;
      }

      try {
        const code = companyCode.trim().toUpperCase();
        const id = studentId.trim();

        const studentRef = doc(db, "CorporateClients", code, "studentInfo", id);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          localStorage.setItem("companyCode", code);
          navigate(`/student-dashboard/${code}/${id}`);
        } else {
          setError("Invalid Student ID");
        }
      } catch (err) {
        console.error("Student login error:", err);
        setError("Something went wrong. Please try again.");
      }
    } else if (selectedLoginType === "admin") {
      if (!companyCode.trim()) {
        setError("Please enter a company code");
        return;
      }

      try {
        const code = companyCode.trim().toUpperCase();
        const docRef = doc(db, "CorporateClients", code);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          localStorage.setItem("companyCode", code);

          if (password === data.adminPassword) {
            navigate("/cpanel");
          } else {
            navigate("/admin_panel");
          }
        } else {
          setError("Invalid Company Code");
        }
      } catch (err) {
        console.error("Admin login error:", err);
        setError("Something went wrong. Please try again.");
      }
    } else {
      setError("Please select login type");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <h1>
          Welcome to <span className="highlight">EduTech Portal</span>
        </h1>

        <div
          className={`info-box ${selectedLoginType === "student" ? "selected" : ""}`}
          onClick={() => setSelectedLoginType("student")}
          style={{ cursor: "pointer" }}
        >
          <h3>For Students</h3>
          <p>Enter your Student ID to access your dashboard.</p>
        </div>

        <div
          className={`info-box ${selectedLoginType === "admin" ? "selected" : ""}`}
          onClick={() => setSelectedLoginType("admin")}
          style={{ cursor: "pointer" }}
        >
          <h3>For Admins</h3>
          <p>Enter your company code and admin password to manage data.</p>
        </div>
      </div>

      <div className="login-right">
        <h2>{selectedLoginType === "student" ? "Student Login" : "Admin Login"}</h2>
        <p>Please enter your credentials to continue.</p>

        <div className="login-form">
          {selectedLoginType === "student" && (
            <>
              <input
                type="text"
                placeholder="Enter Company Code"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </>
          )}

          {selectedLoginType === "admin" && (
            <>
              <input
                type="text"
                placeholder="Enter Company Code"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
              />
              <input
                type="password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          <button onClick={handleLogin} disabled={!selectedLoginType}>
            Login
          </button>
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
