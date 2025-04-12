document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('currentUser')) {
        redirectToMainPage();
    }

    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        authenticateUser(username, password);
    });
});

function authenticateUser(username, password) {
    fetch('../data/users.json')
        .then(response => response.json())
        .then(data => {
            const student = data.students.find(user => 
                user.username === username && user.password === password);
            
            const instructor = data.instructors.find(user => 
                user.username === username && user.password === password);
            
            const admin = data.admins.find(user => 
                user.username === username && user.password === password);

            if (student) {
                handleSuccessfulLogin(student, 'student');
            } else if (instructor) {
                handleSuccessfulLogin(instructor, 'instructor');
            } else if (admin) {
                handleSuccessfulLogin(admin, 'admin');
            } else {
                showError('Invalid username or password');
            }
        })
        .catch(error => {
            console.error('Error loading user data:', error);
            showError('System error. Please try again later.');
        });
}

function handleSuccessfulLogin(user, userType) {
    const userData = {
        username: user.username,
        name: user.name,
        type: userType
    };

    if (userType === 'student') {
        userData.id = user.id;
        userData.completedCourses = user.completedCourses || [];
        userData.registeredCourses = user.registeredCourses || [];
        userData.pendingCourses = user.pendingCourses || [];
        
        userData.classStatus = {};
        fetch('../data/courses.json')
            .then(response => response.json())
            .then(courses => {
                courses.courses.forEach(course => {
                    course.classes.forEach(cls => {
                        if (cls.registeredStudents.includes(user.username)) {
                            userData.classStatus[course.code] = cls.validated;
                        }
                    });
                });
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                redirectToMainPage();
            });
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        redirectToMainPage();
    }
}

function redirectToMainPage() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    
    switch (user.type) {
        case 'student':
            window.location.href = 'main.html';
            break;
        case 'instructor':
            window.location.href = 'instructor.html';
            break;
        case 'admin':
            window.location.href = 'admin.html';
            break;
        default:
            window.location.href = 'main.html';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}