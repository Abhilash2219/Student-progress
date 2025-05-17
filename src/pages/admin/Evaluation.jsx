import { useEffect, useState } from "react";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./Evaluation.css";

const Evaluation = () => {
  const orgCode = localStorage.getItem("orgCode");
  const studentId = localStorage.getItem("studentId");

  const [studentData, setStudentData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("marks");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRef = doc(db, "CorporateClients", orgCode, "studentInfo", studentId);
        const studentSnap = await getDoc(studentRef);

        const companyRef = doc(db, "CorporateClients", orgCode);
        const companySnap = await getDoc(companyRef);

        if (studentSnap.exists()) {
          setStudentData(studentSnap.data());
        } else {
          setError("Student data not found.");
        }

        if (companySnap.exists()) {
          setCompanyData(companySnap.data());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Something went wrong.");
      }
    };

    fetchData();
  }, [orgCode, studentId]);

  if (error) return <div className="error">{error}</div>;
  if (!studentData || !companyData) return <div className="loading">Loading data...</div>;

  const { attendance = {}, marks = {} } = studentData;

  const marksData = [];
  Object.entries(marks).forEach(([courseName, modulesAndComment]) => {
    const courseComment = modulesAndComment.comments || "—";

    Object.entries(modulesAndComment).forEach(([moduleName, scores]) => {
      if (moduleName !== "comments") {
        marksData.push({
          course: courseName,
          module: moduleName,
          assignment: parseInt(scores.assignment || 0),
          quiz: parseInt(scores.quiz || 0),
          comment: courseComment,
        });
      }
    });
  });

  return (
    <div className="studentDashboard">
		<div className="tabs">
		  {["marks", "attendance"].map((tab) => (
			<button
			  key={tab}
			  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
			  onClick={() => setActiveTab(tab)}
			>
			  {tab.charAt(0).toUpperCase() + tab.slice(1)}
			</button>
		  ))}
		</div>



      <div className="tabContent glassBox">
        {activeTab === "attendance" && (
          <>
            <h3>Attendance Overview</h3>
            <div className="attendanceGrid">
              {Object.entries(attendance)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([dateStr, status], idx) => {
                  const date = new Date(dateStr).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  });
                  const statusClass = status.toLowerCase().replace(/\s+/g, "");
                  return (
                    <span key={idx} className={`tag ${statusClass}`}>
                      {date}
                    </span>
                  );
                })}
            </div>
          </>
        )}

        {activeTab === "marks" && (
          <>
            <h3>Marks Table</h3>
            {marksData.length > 0 ? (
              <div className="table-container">
                <table className="marksTable">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Module</th>
                      <th>Assignment</th>
                      <th>Quiz</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const courseCounts = {};
                      marksData.forEach((mark) => {
                        courseCounts[mark.course] = (courseCounts[mark.course] || 0) + 1;
                      });

                      const printedCourses = {};

                      return marksData.map((mark, i) => {
                        const showCourseCell = !printedCourses[mark.course];
                        if (showCourseCell) printedCourses[mark.course] = true;

                        return (
                          <tr key={i}>
                            {showCourseCell && (
                              <td
                                rowSpan={courseCounts[mark.course]}
                                style={{ verticalAlign: "middle", textAlign: "center" }}
                              >
                                {mark.course}
                              </td>
                            )}
                            <td>{mark.module}</td>
                            <td>{mark.assignment}</td>
                            <td>{mark.quiz}</td>
                            {showCourseCell && (
                              <td
                                rowSpan={courseCounts[mark.course]}
                                style={{ verticalAlign: "middle", textAlign: "center" }}
                              >
                                {mark.comment}
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No marks available</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Evaluation;
