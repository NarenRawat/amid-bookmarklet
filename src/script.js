function isBookmarkletConfigured() {
    const data = localStorage.getItem('student_details');

    if (!data) {
        return false;
    }

    try {
        const studentDetails = JSON.parse(data);
        return Object.values(studentDetails).every(Boolean);
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
        RollNo: getElementValueById('RollNo')
    };
}

function configureBookmarklet() {
    const studentDetails = getStudentDetailsFromPage();
    localStorage.setItem("student_details", JSON.stringify(studentDetails));
}

function main() {
    if (!isBookmarkletConfigured()) {
        const hasStudentDetailsOnPage = getElementValueById('hdnCollegeId');

        if (hasStudentDetailsOnPage) {
            configureBookmarklet();
        } else {
            alert('Setup required:\n\nPlease view your attendance manually once, then run the bookmarklet again to finish configuration.');
            return;
        }
    }
}

main();