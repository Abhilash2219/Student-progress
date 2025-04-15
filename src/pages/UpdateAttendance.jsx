import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/UpdateAttendance.css";
import Navbar from "../components/Navbar";

const UpdateAttendance = () => {
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [companyCode, setCompanyCode] = useState("");

  const navigate = useNavigate();

  // Set company code and default date
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

  // Fetch students and their attendance for selectedDate
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
        setStudents(studentList);

        const existingAttendanceMap = {};
        studentList.forEach((student) => {
          const attendanceStatus = student.attendance?.[selectedDate] || "Present";
          existingAttendanceMap[student.id] = attendanceStatus;
        });

        setAttendanceMap(existingAttendanceMap);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudentsAndAttendance();
  }, [companyCode, selectedDate]);

  // Toggle attendance status
  const toggleStatus = (id) => {
    const statuses = ["Present", "Absent", "Late Came", "Early Leave", "Inactive"];
    setAttendanceMap((prev) => {
      const current = prev[id];
      const currentIndex = statuses.indexOf(current);
      const nextIndex = (currentIndex + 1) % statuses.length;
      return { ...prev, [id]: statuses[nextIndex] };
    });
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Submit attendance to Firestore
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
        });
      }

      alert("Attendance updated successfully!");
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance.");
    }
  };

  return (
    <>
      <Navbar />
      <form onSubmit={handleSubmit} className="update-attendance-container">
        <h2>Update Attendance</h2>
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
              <th>Status (Click to Toggle)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.fullName || "-"}</td>
                <td>{student.email}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleStatus(student.id)}
                    className={`attendance-btn ${attendanceMap[student.id]?.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {attendanceMap[student.id]}
                  </button>
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
