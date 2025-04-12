document.addEventListener('DOMContentLoaded', function() {
    // Check instructor authentication
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'instructor') {
        window.location.href = '../login.html';
        return;
    }

    // Display instructor info
    document.getElementById('instructor-name').textContent = currentUser.name;
    document.getElementById('instructor-expertise').textContent = currentUser.expertise?.join(', ') || 'None specified';

    // Load assigned classes
    loadInstructorClasses();

    // Setup event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
});

function loadInstructorClasses() {
    const container = document.getElementById('classes-container');
    if (!container) return;

    container.innerHTML = '<p>Loading your classes...</p>';

    Promise.all([
        fetch('../data/courses.json').then(res => res.json()),
        fetch('../data/users.json').then(res => res.json())
    ])
    .then(([coursesData, usersData]) => {
        const currentInstructor = JSON.parse(sessionStorage.getItem('currentUser'));
        
        // Find all classes taught by this instructor
        const instructorClasses = [];
        
        coursesData.courses.forEach(course => {
            course.classes.forEach(cls => {
                if (cls.instructor === currentInstructor.username && cls.validated) {
                    instructorClasses.push({
                        courseCode: course.code,
                        courseName: course.name,
                        ...cls
                    });
                }
            });
        });

        displayInstructorClasses(instructorClasses, usersData.students);
    })
    .catch(error => {
        console.error('Error loading classes:', error);
        container.innerHTML = '<p class="error">Error loading your classes. Please try again later.</p>';
    });
}

function displayInstructorClasses(classes, allStudents) {
    const container = document.getElementById('classes-container');
    if (!container) return;

    if (classes.length === 0) {
        container.innerHTML = '<p>You have no assigned classes this semester.</p>';
        return;
    }

    container.innerHTML = '';

    classes.forEach(cls => {
        const classCard = document.createElement('div');
        classCard.className = 'class-card';
        
        // Get student details for this class
        const studentsInClass = allStudents.filter(student => 
            cls.registeredStudents.includes(student.username)
        );
        
        const studentList = studentsInClass.map(student => `
            <div class="student-row" data-username="${student.username}">
                <span>${student.name} (${student.id})</span>
                <input type="text" class="grade-input" 
                       value="${getStudentGrade(student, cls.courseCode)}"
                       placeholder="Enter grade">
            </div>
        `).join('');

        classCard.innerHTML = `
            <h3>${cls.courseCode} - ${cls.courseName}</h3>
            <p><strong>Class ID:</strong> ${cls.classId}</p>
            <p><strong>Schedule:</strong> ${cls.schedule}</p>
            <p><strong>Students:</strong> ${cls.registeredStudents.length}/${cls.capacity}</p>
            
            <div class="students-container">
                ${studentList}
            </div>
            
            <button class="save-grades-btn" data-course="${cls.courseCode}" data-class="${cls.classId}">
                Save Grades
            </button>
        `;
        
        container.appendChild(classCard);
    });

    // Add event listeners to save buttons
    document.querySelectorAll('.save-grades-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseCode = this.getAttribute('data-course');
            const classId = this.getAttribute('data-class');
            saveGrades(courseCode, classId);
        });
    });
}

function getStudentGrade(student, courseCode) {
    const completedCourse = student.completedCourses?.find(c => c.courseCode === courseCode);
    return completedCourse?.grade || '';
}

function saveGrades(courseCode, classId) {
    const gradeInputs = document.querySelectorAll(`
        [data-course="${courseCode}"][data-class="${classId}"] .grade-input
    `);

    const gradesToUpdate = [];
    
    gradeInputs.forEach(input => {
        const studentRow = input.closest('.student-row');
        const username = studentRow.getAttribute('data-username');
        const grade = input.value.trim();
        
        if (grade) {
            gradesToUpdate.push({ username, courseCode, grade });
        }
    });

    if (gradesToUpdate.length === 0) {
        alert('Please enter at least one grade to save.');
        return;
    }

    if (!confirm(`Save grades for ${courseCode} (${classId})?`)) {
        return;
    }

    fetch('../data/users.json')
        .then(response => response.json())
        .then(usersData => {
            // Update grades in user data
            const updatedUsers = usersData.students.map(student => {
                const gradeUpdate = gradesToUpdate.find(g => g.username === student.username);
                if (gradeUpdate) {
                    // Remove old grade if exists
                    student.completedCourses = student.completedCourses?.filter(
                        c => c.courseCode !== courseCode
                    ) || [];
                    
                    // Add new grade
                    student.completedCourses.push({
                        courseCode,
                        grade: gradeUpdate.grade
                    });
                    
                    // Remove from registered courses if now completed
                    student.registeredCourses = student.registeredCourses?.filter(
                        code => code !== courseCode
                    ) || [];
                }
                return student;
            });

            // In a real app, you would send this update to the server
            console.log('Grades updated:', gradesToUpdate);
            alert('Grades saved successfully!');
            
            // Reload to show updates
            loadInstructorClasses();
        })
        .catch(error => {
            console.error('Error saving grades:', error);
            alert('Error saving grades. Please try again.');
        });
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../login.html';
}