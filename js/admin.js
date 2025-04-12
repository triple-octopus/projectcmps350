document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'admin') {
        window.location.href = '../login.html';
        return;
    }
    document.getElementById('admin-name').textContent = currentUser.name;
    loadCourses();
    document.getElementById('view-courses-btn').addEventListener('click', function() {
        document.getElementById('courses-section').style.display = 'block';
        document.getElementById('create-course-section').style.display = 'none';
        loadCourses();
    });

    document.getElementById('create-course-btn').addEventListener('click', function() {
        document.getElementById('courses-section').style.display = 'none';
        document.getElementById('create-course-section').style.display = 'block';
    });

    document.getElementById('refresh-btn').addEventListener('click', loadCourses);
    document.getElementById('course-status-filter').addEventListener('change', loadCourses);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('course-creation-form').addEventListener('submit', createCourse);
});

function loadCourses() {
    const statusFilter = document.getElementById('course-status-filter').value;
    
    const localCourses = localStorage.getItem('updatedCourses');
    if (localCourses) {
        processCoursesData(JSON.parse(localCourses), statusFilter);
    } else {
        fetch('../data/courses.json')
            .then(response => response.json())
            .then(data => processCoursesData(data, statusFilter))
            .catch(error => console.error('Error loading courses:', error));
    }
}

function processCoursesData(data, statusFilter) {
    let courses = data.courses;
        if (statusFilter !== 'all') {
        courses = courses.filter(course => {
            if (statusFilter === 'open') return course.status === 'open';
            if (statusFilter === 'in-progress') return course.status === 'in-progress';
            if (statusFilter === 'pending') return course.classes.some(cls => !cls.validated);
            return true;
        });
    }

    displayCourses(courses);
}

function displayCourses(courses) {
    const container = document.getElementById('courses-container');
    container.innerHTML = '';

    if (courses.length === 0) {
        container.innerHTML = '<p>No courses found matching your criteria.</p>';
        return;
    }
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'admin-card';
        courseCard.innerHTML = `
            <h3>${course.code} - ${course.name}</h3>
            <p><strong>Category:</strong> ${course.category}</p>
            <p><strong>Status:</strong> ${course.status}</p>
            <p><strong>Prerequisites:</strong> ${course.prerequisites.join(', ') || 'None'}</p>
            <button class="manage-classes-btn" data-course="${course.code}">Manage Classes</button>
        `;
        container.appendChild(courseCard);
    });
    document.querySelectorAll('.manage-classes-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseCode = this.getAttribute('data-course');
            showClassManagement(courseCode);
        });
    });
}

function showClassManagement(courseCode) {
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            const course = data.courses.find(c => c.code === courseCode);
            if (!course) return;

            const classList = course.classes.map(cls => `
                <div class="class-management-card ${cls.validated ? 'validated' : 'pending'}">
                    <h4>Class ${cls.classId}</h4>
                    <p><strong>Instructor:</strong> ${cls.instructor}</p>
                    <p><strong>Schedule:</strong> ${cls.schedule}</p>
                    <p><strong>Students Registered:</strong> ${cls.registeredStudents.length}/${cls.capacity}</p>
                    <p><strong>Status:</strong> ${cls.validated ? 'Validated' : 'Pending Validation'}</p>
                    
                    <div class="class-actions">
                        ${!cls.validated ? `
                            <button class="validate-btn" data-course="${courseCode}" data-class="${cls.classId}">
                                Validate
                            </button>
                            <button class="cancel-btn" data-course="${courseCode}" data-class="${cls.classId}">
                                Cancel
                            </button>
                        ` : ''}
                        <button class="add-class-btn" data-course="${courseCode}">
                            Add New Class
                        </button>
                    </div>
                </div>
            `).join('');

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>${course.code} - ${course.name}</h3>
                    <div class="class-management-container">${classList}</div>
                </div>
            `;
            document.getElementById('modal-container').appendChild(modal);

            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });

            document.querySelectorAll('.validate-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const courseCode = this.getAttribute('data-course');
                    const classId = this.getAttribute('data-class');
                    validateClass(courseCode, classId);
                    modal.remove();
                });
            });

            document.querySelectorAll('.cancel-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const courseCode = this.getAttribute('data-course');
                    const classId = this.getAttribute('data-class');
                    cancelClass(courseCode, classId);
                    modal.remove();
                });
            });

            document.querySelectorAll('.add-class-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const courseCode = this.getAttribute('data-course');
                    modal.remove();
                    showAddClassForm(courseCode);
                });
            });
        });
}

function validateClass(courseCode, classId) {
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            const course = data.courses.find(c => c.code === courseCode);
            if (course) {
                const cls = course.classes.find(c => c.classId === classId);
                if (cls) {
                    cls.validated = true;
                    
                    return fetch('../data/users.json')
                        .then(response => response.json())
                        .then(users => {
                            const updatedUsers = users.students.map(student => {
                                if (student.pendingCourses.includes(courseCode)) {
                                    student.pendingCourses = student.pendingCourses.filter(c => c !== courseCode);
                                    if (!student.registeredCourses.includes(courseCode)) {
                                        student.registeredCourses.push(courseCode);
                                    }
                                }
                                return student;
                            });
                            
                            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
                            if (currentUser && currentUser.type === 'student' && 
                                updatedUsers.some(u => u.username === currentUser.username)) {
                                const updatedUser = updatedUsers.find(u => u.username === currentUser.username);
                                sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
                            }
                            
                            showSuccessMessage(`Class ${classId} has been validated.`);
                            loadCourses();
                        });
                }
            }
        })
        .catch(error => {
            console.error('Error validating class:', error);
            showErrorMessage('Error validating class. Please try again.');
        });
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">✓</span>
            <span class="notification-text">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">!</span>
            <span class="notification-text">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function cancelClass(courseCode, classId) {
    if (!confirm('Are you sure you want to cancel this class? This action cannot be undone.')) {
        return;
    }

    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            const course = data.courses.find(c => c.code === courseCode);
            if (course) {
                course.classes = course.classes.filter(c => c.classId !== classId);
                alert(`Class ${classId} has been canceled.`);
                loadCourses();
            }
        });
}

function showAddClassForm(courseCode) {
    fetch('../data/users.json')
        .then(response => response.json())
        .then(userData => {
            const instructors = userData.instructors;
            
            const instructorOptions = instructors.map(instructor => 
                `<option value="${instructor.username}">${instructor.name}</option>`
            ).join('');

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3>Add New Class to ${courseCode}</h3>
                    <form id="add-class-form">
                        <div class="form-group">
                            <label for="class-schedule">Schedule</label>
                            <input type="text" id="class-schedule" placeholder="e.g., Mon/Wed 10:00-11:20" required>
                        </div>
                        <div class="form-group">
                            <label for="class-capacity">Capacity</label>
                            <input type="number" id="class-capacity" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="class-instructor">Instructor</label>
                            <select id="class-instructor" required>
                                ${instructorOptions}
                            </select>
                        </div>
                        <button type="submit">Add Class</button>
                    </form>
                </div>
            `;
            document.getElementById('modal-container').appendChild(modal);

            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });

            document.getElementById('add-class-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const schedule = document.getElementById('class-schedule').value;
                const capacity = parseInt(document.getElementById('class-capacity').value);
                const instructor = document.getElementById('class-instructor').value;
                
                addNewClass(courseCode, schedule, capacity, instructor);
                modal.remove();
            });
        });
}

function addNewClass(courseCode, schedule, capacity, instructor) {
    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            const course = data.courses.find(c => c.code === courseCode);
            if (course) {
                const classId = `${courseCode}-${course.classes.length + 1}`;
                
                course.classes.push({
                    classId: classId,
                    instructor: instructor,
                    schedule: schedule,
                    capacity: capacity,
                    registeredStudents: [],
                    validated: false
                });

                alert(`New class ${classId} has been added.`);
                loadCourses();
            }
        });
}

function createCourse(e) {
    e.preventDefault();
    
    const code = document.getElementById('course-code').value;
    const name = document.getElementById('course-name').value;
    const category = document.getElementById('course-category').value;
    const prerequisites = document.getElementById('course-prerequisites').value
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

    if (!code || !name || !category) {
        showErrorMessage('Please fill in all required fields');
        return;
    }

    fetch('../data/courses.json')
        .then(response => response.json())
        .then(data => {
            if (data.courses.some(course => course.code === code)) {
                showErrorMessage('A course with this code already exists.');
                return;
            }

            const newCourse = {
                code: code,
                name: name,
                category: category,
                prerequisites: prerequisites,
                status: 'open',
                classes: []
            };

            data.courses.push(newCourse);

            localStorage.setItem('updatedCourses', JSON.stringify(data));

            showSuccessMessage(`Course ${code} has been created successfully!`);

            document.getElementById('course-creation-form').reset();
            document.getElementById('courses-section').style.display = 'block';
            document.getElementById('create-course-section').style.display = 'none';
            
            loadCourses();
        })
        .catch(error => {
            console.error('Error creating course:', error);
            showErrorMessage('Error creating course. Please try again.');
        });
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../login.html';
}