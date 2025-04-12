document.addEventListener('DOMContentLoaded', function() {
    console.log("Current User:", JSON.parse(sessionStorage.getItem('currentUser')));
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.type !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    const studentNameEl = document.getElementById('student-name');
    const studentIdEl = document.getElementById('student-id');
    if (studentNameEl) studentNameEl.textContent = currentUser.name;
    if (studentIdEl) studentIdEl.textContent = currentUser.id;
    initializePage();
    const searchBtn = document.getElementById('search-btn');
    const categorySelect = document.getElementById('category-select');
    const logoutBtn = document.getElementById('logout-btn');
    if (searchBtn) searchBtn.addEventListener('click', loadAvailableCourses);
    if (categorySelect) categorySelect.addEventListener('change', loadAvailableCourses);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

function initializePage() {
    loadRegisteredCourses();
    loadAvailableCourses();
}

function loadRegisteredCourses() {
    const container = document.getElementById('registered-courses-container');
    if (!container) return;

    container.innerHTML = '<p>Loading your courses...</p>';
    const localCourses = localStorage.getItem('updatedCourses');
    const localUsers = localStorage.getItem('updatedUsers');

    const coursesPromise = localCourses 
        ? Promise.resolve(JSON.parse(localCourses))
        : fetch('data/courses.json').then(res => res.json());

    const usersPromise = localUsers
        ? Promise.resolve(JSON.parse(localUsers))
        : fetch('data/users.json').then(res => res.json());

    Promise.all([coursesPromise, usersPromise])
        .then(([coursesData, usersData]) => {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const dbUser = usersData.students.find(
                student => student.username === currentUser.username
            );
            
            const registeredCourses = coursesData.courses.filter(course => 
                dbUser.registeredCourses.includes(course.code) || 
                dbUser.pendingCourses.includes(course.code)
            );
            
            displayRegisteredCourses(registeredCourses, dbUser);
        })
        .catch(error => {
            console.error('Error loading registered courses:', error);
            container.innerHTML = '<p class="error">Error loading your courses.</p>';
        });
}

function loadRegisteredCourses() {
    const container = document.getElementById('registered-courses-container');
    if (!container) return;
    const localData = localStorage.getItem('courseRegistrationData');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (localData) {
        const data = JSON.parse(localData);
        displayCourses(data.registeredCourses, container);
    } else {
        fetch('data/courses.json')
            .then(response => response.json())
            .then(data => {
                const registeredCourses = data.courses.filter(course => 
                    currentUser.registeredCourses.includes(course.code)
                );
                displayCourses(registeredCourses, container);
            })
            .catch(error => {
                console.error('Error loading courses:', error);
                container.innerHTML = '<p class="error">Error loading your courses.</p>';
            });
    }
}

function displayCourses(courses, container) {
    container.innerHTML = '';

    if (courses.length === 0) {
        container.innerHTML = '<p>You are not registered for any courses.</p>';
        return;
    }
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <h3>${course.code} - ${course.name}</h3>
            <p>Status: ${course.status || 'Registered'}</p>
            <button class="drop-btn" data-course="${course.code}">Drop Course</button>
        `;
        container.appendChild(courseCard);
    });
    setupDropButtonListeners();
}

function loadAvailableCourses() {
    const container = document.getElementById('available-courses-container');
    if (!container) return;
    container.innerHTML = '<p>Loading available courses...</p>';
    Promise.all([
      fetch('data/courses.json').then(res => res.json()),
      fetch('data/users.json').then(res => res.json())
    ])
    .then(([coursesData, usersData]) => {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
      const userFromDB = usersData.students.find(
        student => student.username === currentUser.username
      );
      const availableCourses = filterAvailableCourses(coursesData.courses, userFromDB);
      displayAvailableCourses(availableCourses);
    })
    .catch(error => {
      console.error('Error loading available courses:', error);
      container.innerHTML = '<p class="error">Error loading available courses. Please try again later.</p>';
    });
  }

function filterAvailableCourses(courses, currentUser) {
    return courses.filter(course => {
      if (currentUser.registeredCourses.includes(course.code) || 
          currentUser.pendingCourses.includes(course.code)) {
        return false;
      }
        const completedCodes = currentUser.completedCourses?.map(c => c.courseCode) || [];
      const missingPrereqs = course.prerequisites?.filter(prereq => 
        !completedCodes.includes(prereq)
      ) || [];
  
      return missingPrereqs.length === 0;
    });
  }

function displayAvailableCourses(courses) {
    const container = document.getElementById('available-courses-container');
    if (!container) return;

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p>No courses found matching your criteria.</p>';
        return;
    }
    container.innerHTML = '';
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card available';
        courseCard.innerHTML = `
            <h3>${course.code} - ${course.name}</h3>
            <p><strong>Category:</strong> ${course.category || 'Not specified'}</p>
            <p><strong>Prerequisites:</strong> ${course.prerequisites?.join(', ') || 'None'}</p>
            <p><strong>Status:</strong> ${course.status || 'Not specified'}</p>
            <button class="register-btn" data-course="${course.code}">View Classes</button>
        `;
        container.appendChild(courseCard);
    });
    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseCode = this.getAttribute('data-course');
            showClassSelection(courseCode);
        });
    });
}

function showClassSelection(courseCode) {
    fetch('data/courses.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const course = data.courses?.find(c => c.code === courseCode);
            if (!course) {
                alert('Course not found!');
                return;
            }
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const completedCourses = currentUser.completedCourses?.map(c => c.courseCode) || [];
            
            const missingPrereqs = course.prerequisites?.filter(prereq => 
                !completedCourses.includes(prereq)
            ) || [];
            
            if (missingPrereqs.length > 0) {
                alert(`You cannot register for this course. Missing prerequisites: ${missingPrereqs.join(', ')}`);
                return;
            }
            const classList = course.classes?.map(cls => `
                <div class="class-option">
                    <h4>Class ${cls.classId}</h4>
                    <p>Instructor: ${cls.instructor}</p>
                    <p>Schedule: ${cls.schedule}</p>
                    <p>Available seats: ${cls.capacity - (cls.registeredStudents?.length || 0)}/${cls.capacity}</p>
                    <button class="select-class-btn" 
                            data-course="${courseCode}" 
                            data-class="${cls.classId}">
                        Register
                    </button>
                </div>
            `).join('') || '<p>No classes available for this course.</p>';

            const modalContainer = document.getElementById('modal-container');
            if (!modalContainer) return;
            
            modalContainer.innerHTML = `
                <div class="modal">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>${course.code} - ${course.name}</h3>
                        <div class="class-options">${classList}</div>
                    </div>
                </div>
            `;
            const modal = modalContainer.querySelector('.modal');
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });

            modal.querySelectorAll('.select-class-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const courseCode = this.getAttribute('data-course');
                    const classId = this.getAttribute('data-class');
                    registerForClass(courseCode, classId);
                    modal.remove();
                });
            });
        })
        .catch(error => {
            console.error('Error loading course details:', error);
            alert('Error loading course information. Please try again.');
        });
}

function registerForClass(courseCode, classId) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to register for courses.');
        window.location.href = 'login.html';
        return;
    }
    if ((currentUser.registeredCourses || []).includes(courseCode) || 
        (currentUser.pendingCourses || []).includes(courseCode)) {
        alert('You are already registered or pending registration for this course.');
        return;
    }
    if (!currentUser.pendingCourses) currentUser.pendingCourses = [];
    currentUser.pendingCourses.push(courseCode);
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    fetch('data/courses.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const course = data.courses?.find(c => c.code === courseCode);
            if (course) {
                const cls = course.classes?.find(c => c.classId === classId);
                if (cls) {
                    if (!cls.registeredStudents) cls.registeredStudents = [];
                    cls.registeredStudents.push(currentUser.username);
                    
                    showRegistrationSuccess(courseCode, classId);
                                        loadRegisteredCourses();
                    loadAvailableCourses();
                }
            }
        })
        .catch(error => {
            console.error('Error updating registration:', error);
            alert('Error completing registration. Please try again.');
        });
}

function dropCourse(courseCode) {
    if (!confirm(`Are you sure you want to drop ${courseCode}?`)) {
        return;
    }

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        showErrorMessage('Please login to drop courses.');
        return;
    }
    const dropBtn = document.querySelector(`.drop-btn[data-course="${courseCode}"]`);
    if (dropBtn) {
        dropBtn.disabled = true;
        dropBtn.textContent = 'Processing...';
    }
    let registrationData = JSON.parse(localStorage.getItem('courseRegistrationData')) || {
        registeredCourses: [],
        pendingCourses: []
    };
    registrationData.registeredCourses = registrationData.registeredCourses.filter(
        course => course.code !== courseCode
    );
    localStorage.setItem('courseRegistrationData', JSON.stringify(registrationData));
    const updatedUser = {
        ...currentUser,
        registeredCourses: currentUser.registeredCourses.filter(code => code !== courseCode)
    };
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    showSuccessMessage(`Successfully dropped ${courseCode}`);
    loadRegisteredCourses();
}

function showRegistrationSuccess(courseCode, classId) {
    const notification = document.createElement('div');
    notification.className = 'registration-notification success';
    notification.innerHTML = `
        <div class="notification-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        </div>
        <div class="notification-content">
            <h4>Registration Submitted</h4>
            <p>Successfully registered for ${courseCode} (${classId})</p>
            <p class="notification-status">Status: <span class="status-pending">Pending Admin Approval</span></p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    document.body.appendChild(notification);
    const timer = setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timer);
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });
}

function setupDropButtonListeners() {
    document.querySelectorAll('.drop-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseCode = this.getAttribute('data-course');
            dropCourse(courseCode);
        });
    });
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
function initializeApp() {
    loadRegisteredCourses();
        if (document.readyState === 'complete') {
        loadRegisteredCourses();
    } else {
        window.addEventListener('load', loadRegisteredCourses);
    }
}
initializeApp();