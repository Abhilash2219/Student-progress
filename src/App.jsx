import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RegisterStudent from "./pages/RegisterStudent";
import UpdateAttendance from "./pages/UpdateAttendance";
import UpdateMarks from "./pages/UpdateMarks";
import SharePage from "./pages/SharePage";
import LoginPage from "./pages/Login";
import AddModule from "./pages/AddModule";
import Admincontrol from "./components/Studentdetails";
import StudentDashboard from "./pages/StudentDashboard"; // <-- Import the Student Dashboard

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<LoginPage />} />
        <Route path="/add-module" element={<AddModule />} /> */}
        <Route path="/" element={<Admincontrol />} />
        {/* <Route path="/cpanel" element={<RegisterStudent />} />
        <Route path="/update-attendance" element={<UpdateAttendance />} />
        <Route path="/update-marks" element={<UpdateMarks />} /> */}
        <Route path="/share" element={<SharePage />} />

        {/* ✅ Student Dashboard Route */}
        {/* <Route
          path="/student-dashboard/:companyCode/:studentId"
          element={<StudentDashboard />}
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
