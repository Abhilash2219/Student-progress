import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Make sure this path is correct for your Firebase config
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import './Studentdetails.css';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useLocation, useNavigate } from 'react-router-dom';

// Register Chart.js elements and the plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const StudentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState(''); // State for company nam
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for the company code in the location state or localStorage
    const storedCompanyCode =
      location.state?.companyCode || localStorage.getItem("orgCode") ||localStorage.getItem("companyCode") ;

    if (!storedCompanyCode) {
      alert("Company code missing. Please login again.");
      navigate("/");
    } else {
      setCompanyCode(storedCompanyCode);
    }
  }, [location, navigate]);

// Fetch company name based on the company code
useEffect(() => {
  const fetchCompanyName = async () => {
    try {
      const companyDocRef = doc(db, 'CorporateClients', companyCode);
      const companyDoc = await getDoc(companyDocRef);
      if (companyDoc.exists()) {
        setCompanyName(companyDoc.data().companyName); // Assuming the field is 'companyName'
      } else {
        console.error('Company document not found');
      }
    } catch (error) {
      console.error('Error fetching company name:', error);
    }
  };

  if (companyCode) {
    fetchCompanyName();
  }
}, [companyCode]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!companyCode) {
          throw new Error('Company code is missing');
        }

        const snapshot = await getDocs(collection(db, `CorporateClients/${companyCode}/studentInfo`));
        const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    if (companyCode) {
      fetchStudents();
    }
  }, [companyCode]);

  // Fetch modules for all courses dynamically
  useEffect(() => {
    const fetchModules = async () => {
      try {
        if (!companyCode) {
          throw new Error('Company code is missing');
        }

        // Get a list of all courses
        const programInfoSnapshot = await getDocs(collection(db, `CorporateClients/${companyCode}/programInfo`));
        const programInfoData = programInfoSnapshot.docs.map(doc => doc.id); // Get course names (Course01, Course02, etc.)

        const allModules = [];

        // For each course, fetch its modules
        for (const course of programInfoData) {
          const modulesSnapshot = await getDocs(collection(db, `CorporateClients/${companyCode}/programInfo/${course}/modules`));
          const modulesData = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), course }));
          allModules.push(...modulesData);
        }

        setModules(allModules);
      } catch (error) {
        console.error('Error fetching module data:', error);
      }
    };

    if (companyCode) {
      fetchModules();
    }
  }, [companyCode]);

  const getAttendanceCounts = (attendance = {}) => {
    const counts = { Present: 0, Absent: 0, Late: 0 };
    Object.values(attendance).forEach(status => {
      if (status === 'Present') counts.Present++;
      else if (status === 'Absent') counts.Absent++;
      else if (status === 'Late') counts.Late++;
    });
    return counts;
  };

  const getScoreClass = (score) => {
    const value = parseInt(score, 10);
    if (value >= 85) return 'score-green';
    if (value >= 60) return 'score-yellow';
    return 'score-red';
  };

  // Calculate overall attendance statistics for all students
  const getOverallAttendanceData = () => {
    const overallCounts = { Present: 0, Absent: 0, Late: 0 };

    students.forEach(student => {
      const counts = getAttendanceCounts(student.attendance);
      overallCounts.Present += counts.Present;
      overallCounts.Absent += counts.Absent;
      overallCounts.Late += counts.Late;
    });

    return overallCounts;
  };

  // Pie chart data
  const attendanceData = getOverallAttendanceData();
  const totalAttendance = attendanceData.Present + attendanceData.Absent+attendanceData.Late;

  const pieChartData = {
    labels: ['Present', 'Absent','Late Come'],
    datasets: [
      {
        data: [attendanceData.Present, attendanceData.Absent,attendanceData.Late],
        backgroundColor: ['#4CAF50', '#F44336', '#FFEB3B'], // Colors for Present, Absent, and Late
        hoverBackgroundColor: ['#81C784', '#FFCDD2', '#FFF59D'],
      },
    ],
  };

  // Chart options to show percentages inside the pie chart
  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const percentage = tooltipItem.raw;
            return `${tooltipItem.label}: ${percentage}%`;
          },
        },
      },
      datalabels: {
        formatter: function (value, context) {
          let percentage = (value / totalAttendance) * 100;
          return `${percentage.toFixed(2)}%`;
        },
        color: 'black',
        font: {
          weight: 'bold',
          size: 16,
        },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title"> {companyName || 'Loading...'} Student Dashboard</h1>

      {/* Tab Buttons */}
      <div className="tab-buttons">
        {['summary', 'marks', 'attendance', 'modules'].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'summary' && 'Student Summary'}
            {tab === 'marks' && 'Marksheet Summary'}
            {tab === 'attendance' && 'Attendance Summary'}
            {tab === 'modules' && 'Modules'}
          </button>
        ))}
      </div>

      {/* Student Summary */}
      {activeTab === 'summary' && (
        <div className="student-grid">
          {students.map(student => {
            const counts = getAttendanceCounts(student.attendance);
            return (
              <div key={student.studentId} className="student-card">
                <h2>{student.fullName} ({student.studentId})</h2>
                <div className="attendance-summary">
                  <span className="present-count">Present: {counts.Present}</span>
                  <span className="absent-count">Absent: {counts.Absent}</span>
                  <span className="late-count">Late:{counts.Late}</span>
                </div>
                <button className="view-more-btn" onClick={() => setSelectedStudent(student)}>View More</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Marksheet Summary */}
      {activeTab === 'marks' && (
      <div className="section">
          <h3 className="section-title">Marksheet Summary</h3>
          <table className="marks-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Course</th>
                <th>Module</th>
                <th>Assignment</th>
                <th>Quiz</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const { fullName, studentId, marks = {} } = student;

                // Count total valid module rows across all sorted courses
                const sortedCourseEntries = Object.entries(marks)
                  .filter(([course]) => course !== 'comments')
                  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

                const totalRows = sortedCourseEntries.reduce((acc, [, modules]) => {
                  const validModules = Object.keys(modules).filter(key => key !== 'comments');
                  return acc + validModules.length;
                }, 0);

                let nameDisplayed = false;

                return sortedCourseEntries.flatMap(([course, modules]) => {
                  const courseComments = modules.comments || '';
                  const moduleEntries = Object.entries(modules)
                    .filter(([key]) => key !== 'comments')
                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

                  let courseDisplayed = false;

                  return moduleEntries.map(([module, scores]) => {
                    const assignmentClass = getScoreClass(scores.assignment);
                    const quizClass = getScoreClass(scores.quiz);

                    const row = (
                      <tr key={`${studentId}-${course}-${module}`}>
                        {!nameDisplayed && (
                          <td rowSpan={totalRows} style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>
                            {fullName}
                          </td>
                        )}
                        {!courseDisplayed && (
                          <td rowSpan={moduleEntries.length} style={{ verticalAlign: 'middle', fontWeight: '500' }}>
                            {course}
                          </td>
                        )}
                        <td>{module}</td>
                        <td className={assignmentClass}>{scores.assignment}</td>
                        <td className={quizClass}>{scores.quiz}</td>
                        {!courseDisplayed && (
                          <td rowSpan={moduleEntries.length} style={{ verticalAlign: 'middle' }}>
                            {courseComments}
                          </td>
                        )}
                      </tr>
                    );

                    nameDisplayed = true;
                    courseDisplayed = true;
                    return row;
                  });
                });
              })}
            </tbody>
          </table>
        </div>
)}
      {/* Attendance Summary */}
      {activeTab === 'attendance' && (
        <div className="attendance-summary-section">
          <h3>Overall Attendance</h3>
          <div className="pie-chart-container">
            <Pie data={pieChartData} options={options} />
          </div>
        </div>
      )}

      {/* Modules Section */}
      {activeTab === 'modules' && (
        <div className="modules-section">
          <h3>Modules</h3>

          {/* Dropdown to select course */}
          <div className="course-dropdown">
            <label htmlFor="courseSelect"><strong>Select Course:</strong></label>
            <select
              id="courseSelect"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Select Course --</option>
              {[...new Set(modules.map((mod) => mod.course))].map((courseName) => (
                <option key={courseName} value={courseName}>{courseName}</option>
              ))}
            </select>
          </div>

          <div className="modules-list">
            {selectedCourse ? (
              modules.filter(module => module.course === selectedCourse).length > 0 ? (
                modules
                  .filter(module => module.course === selectedCourse)
                  .map(module => (
                    <div key={module.id} className="module-card">
                      <h4>{module.name}</h4>
                      <p><strong>Start Date:</strong> {module.startDate}</p>
                      <p><strong>End Date:</strong> {module.endDate}</p>
                      <div
                        className={`status-badge ${
                          module.status.trim().toLowerCase() === 'completed'
                            ? 'status-complete'
                            : module.status.trim().toLowerCase() === 'in progress'
                            ? 'status-progress'
                            : 'status-inactive'
                        }`}
                      >
                        {module.status}
                      </div>


                    </div>
                  ))
              ) : (
                <p>No modules found for this course.</p>
              )
            ) : (
              <p>Please select a course to view its modules.</p>
            )}
          </div>
        </div>
      )}


      {/* Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <span className="close-button" onClick={() => setSelectedStudent(null)}>&times;</span>
          <h2>{selectedStudent.fullName} ({selectedStudent.studentId})</h2>
          <p>Email: {selectedStudent.email}</p>
      
          {/* Attendance Section */}
          <h4>Attendance and Comments</h4>
          <table className="modal-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {selectedStudent.attendance &&
                Object.entries(selectedStudent.attendance).map(([date, status]) => (
                  <tr key={date}>
                    <td>{date}</td>
                    <td>{status}</td>
                    <td>
                      {selectedStudent.comments && selectedStudent.comments[date]
                        ? selectedStudent.comments[date]
                        : "No comment"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

      
          {/* Marks Section */}
          <h4>Marks</h4>
          <table className="modal-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Module</th>
                <th>Assignment</th>
                <th>Quiz</th>
              </tr>
            </thead>
            <tbody>
              {selectedStudent && selectedStudent.marks &&
                Object.entries(selectedStudent.marks)
                  .sort(([courseA], [courseB]) => courseA.localeCompare(courseB)) // Sort by course name
                  .flatMap(([course, modules]) => {
                    const moduleEntries = Object.entries(modules).sort(([moduleA], [moduleB]) => moduleA.localeCompare(moduleB));
                    let courseDisplayed = false;
      
                    return moduleEntries.map(([module, scores]) => {
                      const assignmentClass = getScoreClass(scores.assignment);
                      const quizClass = getScoreClass(scores.quiz);
      
                      const row = (
                        <tr key={`${course}-${module}`}>
                          {!courseDisplayed && (
                            <td rowSpan={moduleEntries.length} style={{ verticalAlign: 'middle', fontWeight: '500' }}>
                              {course}
                            </td>
                          )}
                          <td>{module}</td>
                          <td className={assignmentClass}>{scores.assignment}</td>
                          <td className={quizClass}>{scores.quiz}</td>
                        </tr>
                      );
      
                      courseDisplayed = true;
                      return row;
                    });
                  })}
            </tbody>
          </table>
        </div>
      </div>
      
      )}
    </div>
  );
};

export default StudentDashboard;
