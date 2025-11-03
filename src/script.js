function isStudentDetailsComplete(details) {
    return (
        !!details &&
        typeof details === "object" &&
        Object.values(details).every(Boolean)
    );
}

function isBookmarkletConfigured() {
    const data = localStorage.getItem('student_details');

    if (!data) {
        return false;
    }

    try {
        const studentDetails = JSON.parse(data);
        return isStudentDetailsComplete(studentDetails);
    } catch {
        return false;
    }
}

function getElementValueById(id) {
    const element = document.getElementById(id)
    return element?.value ?? null;
}

function getStudentDetailsFromPage() {
    return {
        CollegeId: getElementValueById('hdnCollegeId'),
        CourseId: getElementValueById('hdnCourseId'),
        BranchId: getElementValueById('hdnBranchId'),
        StudentAdmissionId: getElementValueById('hdnStudentAdmissionId'),
        DateOfBirth: getElementValueById('DateOfBirth'),
        RollNo: getElementValueById('RollNo'),
        CourseBatchDurationId: getElementValueById('CourseBranchDurationId'),
        SessionYear: getElementValueById('SessionYear')
    };
}

function configureBookmarklet() {
    const studentDetails = getStudentDetailsFromPage();

    if (!isStudentDetailsComplete(studentDetails)) {
        return false;
    }

    localStorage.setItem("student_details", JSON.stringify(studentDetails));

    return isBookmarkletConfigured();
}

function main() {
    if (!isBookmarkletConfigured()) {
        const hasStudentDetailsOnPage = getElementValueById('hdnCollegeId');

        if (!hasStudentDetailsOnPage) {
            alert('Setup required:\n\nPlease view your attendance manually once, then run the bookmarklet again to finish configuration.');
            return;
        }

        const configured = configureBookmarklet();
        if (!configured) {
            alert('Configuration failed:\n\nCould not save student details. Please try again after viewing attendance.');
            return;
        }
    }
}

main();