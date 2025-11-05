{
    const $ = id => document.getElementById(id);

    const circularProgressBarHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100">
            <circle class="progress" cx="50" cy="50" r="40" stroke-linecap="round" />
            <circle class="track" cx="50" cy="50" r="40" stroke-linecap="round" />
        </svg>
        <div class="text">
            <div class="primary">0%</div>
            <div class="secondary"></div>
        </div>
    `

    function createCircularProgressBar(secondaryText="") {
        const container = document.createElement("div");
        container.classList.add("circularProgressBar");
        container.innerHTML = circularProgressBarHTML;

        const progress = container.getElementsByClassName("progress")[0];
        const secondaryTextDiv = container.getElementsByClassName("secondary")[0];
        secondaryTextDiv.innerText = secondaryText;

        const r = progress.r.baseVal.value;
        const circumference = 2 * Math.PI * r;

        progress.style.strokeDasharray = circumference;
        progress.style.strokeDashoffset = circumference;

        return container;
    }

    function updateCircularProgressBar(progressBarContainer, percent) {
        const progress = progressBarContainer.getElementsByClassName("progress")[0];
        const r = progress.r.baseVal.value;
        const circumference = 2 * Math.PI * r;

        progress.style.strokeDashoffset = circumference * (1 - percent / 100);

        if (percent < 75) {
            progress.style.stroke = "#ec5840";
        } else if (percent <80) {
            progress.style.stroke = "#ffae00";
        } else {
            progress.style.stroke = "#3adb76"
        }

        const text = progressBarContainer.getElementsByClassName("primary")[0];
        text.innerText = percent + "%";
    }
    ///////////////////////////////////////////

    const STORAGE_KEYS = {
        STUDENT: "studentDetails",
        ATTENDANCE: "attendanceRecord"
    }

    function loadStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    ///////////////////////////////////////////

    function injectHTML() {
        const HTMLContent = `
        <div class="heading">Semester Attendance Report</div>
        <div class="subjectReport"></div>
        <div class="actionButtons flexCenter">
            <div id="clearCacheBtn" class="textButton flexCenter">Clear Cache</div>
            <div id="resetBtn" class="textButton flexCenter">Reset Bookmarklet</div>
        </div>
        `;

        const container = document.createElement("div");
        container.id = "amid-container";
        container.innerHTML = HTMLContent;
        container.classList.add("flexCenter");

        const overallAttendanceProgressBar = createCircularProgressBar("Overall");
        overallAttendanceProgressBar.id = "overallAttendanceProgressBar"
        const headingDiv = container.getElementsByClassName("heading")[0];
        headingDiv.insertAdjacentElement("afterend", overallAttendanceProgressBar);

        container.querySelector("#resetBtn").addEventListener("click", () => {
            localStorage.clear();
            window.location.reload();
        });
        container.querySelector("#clearCacheBtn").addEventListener("click", () => {
            localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
            window.location.reload();
        });

        document.getElementById("PrintDiv").before(container);
    }

    function injectCSS() {
        const CSSContent = `
        #amid-container {
            box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            margin: 5%;
            padding: 20px;
            flex-wrap: wrap;
            gap: 20px;
        }

        .heading {
            flex: 100%;
            text-align: center;
            font-size: clamp(32px, 4vw, 3rem);
            font-weight: bold;
        }

        .flexCenter {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .circularProgressBar {
            aspect-ratio: 1;
            position: relative;
            flex: 0 0 300px;
        }

        .circularProgressBar .text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: clamp(32px, 4vw, 3rem);
        }

        .circularProgressBar .text .primary {
            text-align: center;
            font-size: 1em;
            font-weight: bold;
            line-height: 1;
            margin-bottom: 5px;
        }

        .circularProgressBar .text .secondary {
            text-align: center;
            font-size: 0.7em;
            font-weight: bold;
            opacity: 0.7;
            line-height: 1;
        }

        .circularProgressBar svg {
            width: 100%;
            height: 100%;

            transform: rotate(-90deg);
        }

        .circularProgressBar svg circle {
            fill: none;
            stroke-width: 10;
        }

        .circularProgressBar .progress {
            transition: stroke-dashoffset 400ms cubic-bezier(.22, .9, .37, 1);
        }

        .circularProgressBar .track {
            stroke: #00000033;
        }

        .actionButtons {
            flex: 100%;
            gap: 20px 30px;
            flex-wrap: wrap;
        }

        .textButton {
            flex: 1 1 200px;
            max-width: 400px;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            background-color: #8CBDF2;
            color: #0a2e52;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            user-select: none;
            -webkit-user-select: none;
            transition: .2s ease;
        }

        .textButton:active {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transform: translateY(1px);
        }

        @media screen and (max-width: 600px) {
            .circularProgressBar {
                aspect-ratio: 1;
                position: relative;
                flex: 0 0 100%;
            }
        }
        `;

        const style = document.createElement("style");
        style.id = "amid-style"
        style.innerText = CSSContent;
        document.head.appendChild(style);
    }

    function cleanup() {
        $('amid-container')?.remove();
        $('amid-style')?.remove();
    }

    ///////////////////////////////////////////

    function getOverallAttendancePercent() {
        const attendance = loadStorage(STORAGE_KEYS.ATTENDANCE);

        let held = 0;
        let attended = 0;

        for (const m in attendance) {
            const monthAttendance = attendance[m];
            for (const subject in monthAttendance) {
                held += monthAttendance[subject].held;
                attended += monthAttendance[subject].attended;
            }
        }

        return held ? Math.floor(attended / held * 100) : 0;
    }

    function showAttendanceReport() {
        const overallPercent = getOverallAttendancePercent();
        updateCircularProgressBar($("overallAttendanceProgressBar"), overallPercent);
    }

    function parseAttendanceTable(html) {
        const div = document.createElement("div");
        div.innerHTML = html;

        const rows = Array.from(div.querySelectorAll("tbody tr"));

        return Object.fromEntries(
            rows.map(
                row => {
                    const cells = row.cells;
                    const subject = cells[0].innerHTML.trim();
                    const held = Number(cells[cells.length - 3].innerText);
                    const attended = Number(cells[cells.length - 2].innerText);
                    return [
                        subject,
                        {
                            held: held,
                            attended: attended
                        }
                    ]
                }
            )
        )
    }

    async function fetchAttendanceData(params) {
        const baseUrl = "https://online.uktech.ac.in/ums/Student/Public/ShowStudentAttendanceListByRollNoDOB";
        const url = new URL(baseUrl);
        url.search = new URLSearchParams(params).toString();

        const response = await fetch(url);
        return await response.json();
    }

    async function getMonthAttendance(month, year) {
        const studentDetails = loadStorage(STORAGE_KEYS.STUDENT);
        const response = await fetchAttendanceData({
            ...studentDetails,
            Year: year,
            MonthId: month
        });

        return parseAttendanceTable(response);
    }


    async function populateMonthRangeAttendance(data, startMonth, endMonth, year) {
        for (let m = startMonth; m <= endMonth; m++) {
            if (!(m in data)) {
                data[m] = await getMonthAttendance(m, year);
            }
        }
    }

    async function getCurrentSemesterAttendance(semester) {
        const isOddSem = semester % 2 !== 0;
        const startMonth = isOddSem ? 7 : 1;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const data = loadStorage(STORAGE_KEYS.ATTENDANCE) ?? {};

        if (startMonth < currentMonth) {
            await populateMonthRangeAttendance(data, startMonth, currentMonth - 1, currentYear);
        } else if (startMonth > currentMonth) {
            await populateMonthRangeAttendance(data, startMonth, 12, currentYear - 1)
            await populateMonthRangeAttendance(data, 1, currentMonth - 1, currentYear);
        }

        const yearForCurrentMonth = startMonth > currentMonth ? currentYear + 1 : currentYear;
        data[currentMonth] = await getMonthAttendance(currentMonth, yearForCurrentMonth);

        return data;
    }

    async function syncAttendanceData() {
        const studentDetails = loadStorage(STORAGE_KEYS.STUDENT);
        const semester = +studentDetails.CourseBranchDurationId;
        const updatedData = await getCurrentSemesterAttendance(semester);
        saveStorage(STORAGE_KEYS.ATTENDANCE, updatedData);
    }

    ///////////////////////////////////////////

    function isStudentDetailsComplete(details) {
        return (
            !!details &&
            typeof details === "object" &&
            Object.values(details).every(Boolean)
        );
    }

    function isBookmarkletConfigured() {
        const data = loadStorage(STORAGE_KEYS.STUDENT);
        return isStudentDetailsComplete(data);
    }

    function getStudentDetailsFromPage() {
        const ids = [
            'hdnCollegeId',
            'hdnCourseId',
            'hdnBranchId',
            'hdnStudentAdmissionId',
            'DateOfBirth',
            'RollNo',
            'CourseBranchDurationId',
            'SessionYear'
        ];

        return Object.fromEntries(
            ids.map(
                id => [
                    id.replace(/^hdn/, ''),
                    $(id)?.value ?? null
                ]
            )
        );

    }

    function configureStudentDetails() {
        const studentDetails = getStudentDetailsFromPage();

        if (!isStudentDetailsComplete(studentDetails)) {
            return false;
        }

        saveStorage(STORAGE_KEYS.STUDENT, studentDetails);
        return true;
    }

    function configureBookmarklet() {

        // The page has student details if this element is available
        const hasStudentDetailsOnPage = $('hdnCollegeId')

        if (!hasStudentDetailsOnPage) {
            alert('Setup required:\n\nPlease view your current semester attendance manually once, then run the bookmarklet again to finish configuration.');
            return false;
        }

        if (!configureStudentDetails()) {
            alert('Configuration failed:\n\nCould not save student details. Please try again after viewing attendance.');
            return false;
        }

        return true;
    }

    ///////////////////////////////////////////

    async function main() {
        cleanup();

        if (!isBookmarkletConfigured()) {
            const success = configureBookmarklet();
            if (!success) return;
        }

        injectHTML();
        injectCSS();

        await syncAttendanceData();

        showAttendanceReport();
    }

    main();
}