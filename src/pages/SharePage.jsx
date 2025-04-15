import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import "../styles/SharePage.css";
import Navbar from "../components/Navbar";

const SharePage = () => {
  const [students, setStudents] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const companyCode = localStorage.getItem("companyCode");

  const getToday = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayFormatted = getToday();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyDocRef = doc(db, "CorporateClients", companyCode);
        const companySnapshot = await getDoc(companyDocRef);

        if (companySnapshot.exists()) {
          const data = companySnapshot.data();
          const admins = data.adminEmails || [];

          setAdminEmails(admins);

          const studentsRef = collection(db, "CorporateClients", companyCode, "studentInfo");
          const snapshot = await getDocs(studentsRef);

          const studentList = snapshot.docs.map((doc) => {
            const studentData = doc.data();
            return {
              id: doc.id,
              ...studentData,
            };
          });

          setStudents(studentList);
        } else {
          alert("Invalid company code.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyCode]);

  const handleAttendanceShare = (e) => {
    e.preventDefault();

    const tableHeader = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>#</th>
            <th>Name</th>
            <th>Status on ${todayFormatted}</th>
            <th>Days Present</th>
            <th>Days Absent</th>
            <th>Days Late</th>
          </tr>
        </thead>
        <tbody>
    `;

    const tableRows = students
      .map((student, index) => {
        const attendance = student.attendance || {};
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        // Calculate attendance stats
        Object.values(attendance).forEach((status) => {
          if (status === "Present") presentCount++;
          else if (status === "Absent") absentCount++;
          else if (status === "Late Came") lateCount++;
        });

        const todayStatus = attendance[todayFormatted] || "N/A";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.fullName || "N/A"}</td>
            <td>${todayStatus}</td>
            <td>${presentCount}</td>
            <td>${absentCount}</td>
            <td>${lateCount}</td>
          </tr>
        `;
      })
      .join("");

    const tableFooter = `</tbody></table>`;

    const messageHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Hello Admin,</p>
        <p>Here is the <strong>student attendance summary</strong> for <strong>${companyCode}</strong> on <strong>${todayFormatted}</strong>:</p>
        ${tableHeader + tableRows + tableFooter}
        <p>Regards,<br/>Team</p>
      </div>
    `;

    adminEmails.forEach((email) => {
      const templateParams = {
        to_email: email,
        message: messageHtml,
      };

      emailjs
        .send(
          "service_jbps4bn",
          "template_wipt9rg",
          templateParams,
          "OGVGrLXoQYAfmldzC"
        )
        .then(
          () => {
            console.log(`Email sent to ${email}`);
          },
          (error) => {
            console.error(`Failed to send email to ${email}:`, error);
          }
        );
    });

    alert("Attendance emails sent to all admin emails.");
  };

  const handleMarksShare = (e) => {
    e.preventDefault();
  
    const tableHeader = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead style="background-color: #f2f2f2;">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Course</th>
            <th>Module</th>
            <th>Assignment</th>
            <th>Quiz</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    let rowCount = 1;
    const tableRows = students
      .map((student) => {
        const fullName = student.fullName || "N/A";
        const courses = student.marks || {};
  
        return Object.entries(courses)
          .sort(([courseA], [courseB]) => courseA.localeCompare(courseB))
          .map(([course, modules]) => {
            const moduleEntries = Object.entries(modules).sort(([modA], [modB]) => modA.localeCompare(modB));
  
            return moduleEntries.map(([module, scores], index) => {
              return `
                <tr>
                  ${index === 0 ? `<td rowspan="${moduleEntries.length}">${rowCount++}</td>
                                   <td rowspan="${moduleEntries.length}">${fullName}</td>
                                   <td rowspan="${moduleEntries.length}">${course}</td>` : ""}
                  <td>${module}</td>
                  <td>${scores.assignment || "N/A"}</td>
                  <td>${scores.quiz || "N/A"}</td>
                </tr>
              `;
            }).join("");
          }).join("");
      })
      .join("");
  
    const tableFooter = `</tbody></table>`;
  
    const messageHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Hello Admin,</p>
        <p>Here is the <strong>student module marks summary</strong> for <strong>${companyCode}</strong>:</p>
        ${tableHeader + tableRows + tableFooter}
        <p>Regards,<br/>Team</p>
      </div>
    `;
  
    // Send the email to each admin
    adminEmails.forEach((email) => {
      const templateParams = {
        to_email: email,
        message: messageHtml,
      };
  
      emailjs
        .send(
          "service_jbps4bn",
          "template_wipt9rg",
          templateParams,
          "OGVGrLXoQYAfmldzC"
        )
        .then(
          () => {
            console.log(`Email sent to ${email}`);
          },
          (error) => {
            console.error(`Failed to send email to ${email}:`, error);
          }
        );
    });
  
    alert("Module marks emails sent to all admin emails.");
  };
  
  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="share-page">
        <h2>📤 Send Summaries to Admins</h2>
        <form className="share-form">
          <button type="button" onClick={handleAttendanceShare}>
            Send Attendance Summary
          </button>
          <button type="button" onClick={handleMarksShare}>
            Send Module Marks Summary
          </button>
        </form>
      </div>
    </>
  );
};

export default SharePage;
