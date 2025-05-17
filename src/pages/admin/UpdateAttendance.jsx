import { useState, useEffect, lazy, Suspense } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import "./UpdateAttendance.css";

// Lazy load both navbars
const Navbar = lazy(() => import("./Navbar"));
const NavbarApp = lazy(() => import("./NavbarApp"));

const UpdateAttendance = () => {
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [commentMap, setCommentMap] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [prevDayAttendance, setPrevDayAttendance] = useState({});
  const [prevDate, setPrevDate] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const NavbarComponent = location.pathname.includes("/app")
    ? NavbarApp
    : Navbar;

  useEffect(() => {
    const storedCode = localStorage.getItem("companyCode");
    if (!storedCode) {
      alert("Company not found. Please login again.");
      navigate("/");
      return;
    }
    setCompanyCode(storedCode);

    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, [navigate]);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!companyCode || !selectedDate) return;

      try {
        const studentsRef = collection(
          db,
          `CorporateClients/${companyCode}/studentInfo`
        );
        const querySnapshot = await getDocs(query(studentsRef));

        const studentList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        studentList.sort((a, b) =>
          (a.fullName || "").localeCompare(b.fullName || "")
        );

        setStudents(studentList);

        const attendanceObj = {};
        const commentObj = {};
        const prevAttendanceObj = {};

        const prev = getPreviousDate(selectedDate);
        setPrevDate(prev);

        studentList.forEach((student) => {
          attendanceObj[student.id] =
            student.attendance?.[selectedDate] || "Absent";
          commentObj[student.id] = student.comments?.[selectedDate] || "";
          prevAttendanceObj[student.id] =
            student.attendance?.[prev] || "Absent";
        });

        setAttendanceMap(attendanceObj);
        setCommentMap(commentObj);
        setPrevDayAttendance(prevAttendanceObj);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudentsAndAttendance();
  }, [companyCode, selectedDate]);

  const getPreviousDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  };

  const toggleStatus = (id) => {
    const statuses = ["Absent", "Present", "Late"];
    setAttendanceMap((prev) => {
      const current = prev[id];
      const currentIndex = statuses.indexOf(current);
      const nextIndex = (currentIndex + 1) % statuses.length;
      return { ...prev, [id]: statuses[nextIndex] };
    });
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleCommentChange = (id, comment) => {
    setCommentMap((prev) => ({ ...prev, [id]: comment }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) return alert("Please select a date!");

    try {
      for (const student of students) {
        const studentRef = doc(
          db,
          `CorporateClients/${companyCode}/studentInfo`,
          student.id
        );

        await updateDoc(studentRef, {
          [`attendance.${selectedDate}`]: attendanceMap[student.id],
          [`comments.${selectedDate}`]: commentMap[student.id],
        });
      }

      alert("Attendance and comments updated successfully!");
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance.");
    }
  };

  const getColorClass = (status) => {
    const lower = status?.toLowerCase();
    if (lower === "present") return "present";
    if (lower === "late") return "late";
    return "absent"; // default
  };

  return (
    <>
      <Suspense fallback={<div>Loading Navbar...</div>}>
        <NavbarComponent />
      </Suspense>

      <form onSubmit={handleSubmit} className="update-attendance-container">
        <label>Select Date: </label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          required
        />

        <table className="update-attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Previous Day({prevDate})</th>
              <th>Status (Click to Toggle)</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.fullName || "-"}</td>
                <td>{student.email}</td>
                <td>
                  <span
                    className={`prev-attendance ${getColorClass(
                      prevDayAttendance[student.id]
                    )}`}
                  >
                    {prevDayAttendance[student.id]}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleStatus(student.id)}
                    className={`attendance-btn ${getColorClass(
                      attendanceMap[student.id]
                    )}`}
                  >
                    {attendanceMap[student.id]}
                  </button>
                </td>
                <td>
                  <input
                    type="text"
                    value={commentMap[student.id] || ""}
                    onChange={(e) =>
                      handleCommentChange(student.id, e.target.value)
                    }
                    placeholder="Enter comment"
                    className="comment-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="submit">Save Attendance</button>
      </form>
    </>
  );
};

export default UpdateAttendance;
