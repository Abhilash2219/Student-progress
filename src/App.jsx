import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RegisterStudent from "./pages/admin/RegisterStudent";
import UpdateAttendance from "./pages/admin/UpdateAttendance";
import UpdateMarks from "./pages/admin/UpdateMarks";
import SharePage from "./pages/admin/SharePage";
import LoginPage from "./pages/admin/Login";
import AddModule from "./pages/admin/AddModule";
import Admincontrol from "./pages/summary/Studentdetails";
import StudentDashboard from "./pages/admin/StudentDashboard";
// import NotesSection from "./pages/admin/NotesSection";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/add-module" element={<AddModule />} />
        <Route path="/admin_panel" element={<Admincontrol />} />
        <Route path="/RegisterStudent" element={<RegisterStudent />} />
        <Route path="/update-attendance" element={<UpdateAttendance />} />
        <Route path="/update-marks" element={<UpdateMarks />} />
        <Route path="/share" element={<SharePage />} />
        {/* <Route path="/notes" element={<NotesSection />} /> */}
        

        {/* ✅ Student Dashboard Route */}
        <Route
          path="/student-dashboard/:companyCode/:studentId"
          element={<StudentDashboard />}
        />
      </Routes>
    </Router>
  );
}

export default App;
