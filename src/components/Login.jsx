import { useState } from "react";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "../styles/Login.css";

const Login = () => {
  const [companyCode, setCompanyCode] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const companyDocRef = doc(db, "CorporateClients", companyCode);
      const companySnapshot = await getDoc(companyDocRef);

      if (companySnapshot.exists()) {
        localStorage.setItem("companyCode", companyCode);

        // 🧠 Pattern-based dynamic redirection
        if (companyCode.includes("_")) {
          // Example: GSK2025_GSK, WIPRO2025_wipro → admincontrol-panel
          navigate("/admincontrol-panel");
        } else {
          // Example: GSK2025, WIPRO2025, GOOGLE2025 → admin
          navigate("/register");
        }
      } else {
        alert("Invalid Company Code");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Try again.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <h1>
          <span className="highlight">NaveenPN</span> Trainer, <br />
          <span className="highlight">Education</span> Technology
        </h1>
        <div className="info-box">
          <h3>🎯 Personalized Learning</h3>
          <p>Delivering tailored content to enhance student performance</p>
        </div>
        <div className="info-box">
          <h3>🌐 Tech-Powered Training</h3>
          <p>Empowering education with the latest digital tools</p>
        </div>
      </div>

      <div className="login-right">
        <h2>Login / Signup</h2>
        <p>Enter your company code to continue</p>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Enter Company Code"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            required
          />
          <button type="submit">Continue</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
