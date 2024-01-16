document.addEventListener('DOMContentLoaded', function () {

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html'; 
        });
    }

    const refreshProjectsButton = document.getElementById('refreshProjectsButton');
    if (refreshProjectsButton) {
        refreshProjectsButton.addEventListener('click', function () {
            loadProjects();
            loadBugs()
        });
    }

    const showAllButton = document.getElementById('showAllButton');
    if (showAllButton) {
        showAllButton.addEventListener('click', () => {
            loadBugsAndProjects(); 
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        document.getElementById('registerForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            console.log('Trimitere date pentru înregistrare:', JSON.stringify({ email, password }));
            const role = document.getElementById('role').value;
            fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role }),
            })
                .then(response => {
                    console.log('Răspuns primit la înregistrare:', response);
                    if (!response.ok) {
                        throw new Error('Eroare la înregistrare');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Înregistrare cu succes:', data);
                    alert('Înregistrare reușită!');
                    registerForm.reset();
                })
                .catch((error) => {
                    console.error('Eroare la înregistrare:', error);
                    alert('Eroare la înregistrare.');
                });
        });
    }

    function loadBugsAndProjects() {
        const token = getToken();
        fetch('http://localhost:3000/bugs-and-projects', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                const bugsList = document.getElementById('bugsList');
                const projectsList = document.getElementById('projectsList');

                bugsList.innerHTML = '';
                projectsList.innerHTML = '';

                const bugs = data.bugs;
                const projects = data.projects;

                bugs.forEach(bug => {
                    const bugItem = document.createElement('div');
                    bugItem.classList.add('bug-item');
                    bugItem.innerHTML = `
                    <strong>Severitate:</strong> ${bug.severity}<br>
                    <strong>Prioritate:</strong> ${bug.priority}<br>
                    <strong>Descriere:</strong> ${bug.description}<br>
                    <strong>Commit:</strong> <a href="${bug.commit_link}" target="_blank">Link</a>
                `;

                    // Generează coordonate aleatorii pentru poziția top și left
                    const randomTop = Math.floor(Math.random() * window.innerHeight);
                    const randomLeft = Math.floor(Math.random() * window.innerWidth);

                    // Setează poziția absolută a elementului la coordonatele aleatorii
                    bugItem.style.position = 'absolute';
                    bugItem.style.top = `${randomTop}px`;
                    bugItem.style.left = `${randomLeft}px`;

                    bugsList.appendChild(bugItem); // Adaugă bug-ul la lista de bug-uri

                    // Aplică funcționalitatea de draggable
                    makeDraggable(bugItem);
                });

                projects.forEach(project => {
                    const projectItem = document.createElement('div');
                    projectItem.classList.add('project-item');
                    projectItem.innerHTML = `
                    <h3>${project.name}</h3>
                    <p>Repository: <a href="${project.repository}" target="_blank">${project.repository}</a></p>
                    <p>Echipa: ${project.team}</p>
                `;

                    const randomTop = Math.floor(Math.random() * window.innerHeight);
                    const randomLeft = Math.floor(Math.random() * window.innerWidth);

                    projectItem.style.position = 'absolute';
                    projectItem.style.top = `${randomTop}px`;
                    projectItem.style.left = `${randomLeft}px`;

                    projectsList.insertBefore(projectItem, projectsList.firstChild); 
                    makeDraggable(projectItem);
                });
            })
            .catch(error => console.error('Error loading bugs and projects:', error));
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        document.getElementById('loginForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            console.log('Trimitere date pentru autentificare:', { email, password });

            fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
                .then(response => {
                    console.log('Răspuns primit de la server:', response); 
                    if (!response.ok) {
                        throw new Error('Autentificare eșuată');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Autentificare cu succes, token primit:', data); 
                    localStorage.setItem('jwtToken', data.token);
                    window.location.href = 'addProject.html';
                })
                .catch(error => {
                    console.error('Eroare la autentificare:', error);
                    alert('Eroare la autentificare.');
                });
        });
    }

    const SERVER_URL = 'http://localhost:3000/projects';

    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('projectName').value;
            const repository = document.getElementById('projectRepo').value;
            const team = document.getElementById('projectTeam').value;
            const current_user = document.getElementById('ownerId').value
            const token = localStorage.getItem('jwtToken');

            if (!token) {
                alert('Nu ești autentificat. Te rugăm să te autentifici.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch(SERVER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, repository, team, current_user }),
                });

                if (!response.ok) {
                    if (response.status === 403) {
                        alert('Nu ai permisiunea de a adăuga proiecte. Doar utilizatorii cu rolul MP pot adăuga proiecte.');
                    } else {
                        const error = await response.text();
                        throw new Error(error);
                    }
                }

                const data = await response.json();
                console.log('Proiect adăugat cu succes:', data);
                addProjectToList({ name, repository, team, current_user });
                alert('Proiect adăugat cu succes!');
                projectForm.reset();
            } catch (error) {
                console.error('Eroare la adăugarea proiectului:', error);
                alert(`A apărut o eroare: ${error.message}`);
            }
        });
    }

    function makeDraggable(element) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        element.addEventListener('mousedown', function (e) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.zIndex = '1000'; 
        });

        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                element.style.left = e.clientX - offsetX + 'px';
                element.style.top = e.clientY - offsetY + 'px';
            }
        });

        document.addEventListener('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = 'auto';
            }
        });
    }

    document.querySelectorAll('.project-item').forEach(makeDraggable);
    function loadProjects() {
        if (!isLoggedIn()) {
            alert('You must be logged in to view projects!');
            return;
        }

        const token = getToken();

        fetch('http://localhost:3000/myprojects', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(projects => {
                const projectsList = document.getElementById('projectsList');
                projectsList.innerHTML = '';
                projects.forEach(project => {
                    const projectItem = document.createElement('div');
                    projectItem.classList.add('project-item');
                    projectItem.innerHTML = `
                        <h3>${project.name}</h3>
                        <p>Repository: <a href="${project.repository}" target="_blank">${project.repository}</a></p>
                        <p>Echipa: ${project.team}</p>`;
                    const randomTop = Math.floor(Math.random() * window.innerHeight);
                    const randomLeft = Math.floor(Math.random() * window.innerWidth);

                    projectItem.style.position = 'absolute';
                    projectItem.style.top = `${randomTop}px`;
                    projectItem.style.left = `${randomLeft}px`;

                    projectsList.insertBefore(projectItem, projectsList.firstChild); 

                    makeDraggable(projectItem); 
                });
            })
            .catch(error => console.error('Error loading projects:', error));
    }

    function loadBugs() {
        if (!isLoggedIn()) {
            alert('You must be logged in to view bugs!');
            return;
        }

        const token = getToken();

        fetch('http://localhost:3000/mybugs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(bugs => {
                const bugsList = document.getElementById('bugsList');
                bugsList.innerHTML = '';
                bugs.forEach(bug => {
                    const bugItem = document.createElement('div');
                    bugItem.classList.add('bug-item');
                    bugItem.innerHTML = `
                    <strong>Severitate:</strong> ${bug.severity}<br>
                    <strong>Prioritate:</strong> ${bug.priority}<br>
                    <strong>Descriere:</strong> ${bug.description}<br>
                    <strong>Commit:</strong> <a href="${bug.commit_link}" target="_blank">Link</a>
                `;

                    const randomTop = Math.floor(Math.random() * window.innerHeight);
                    const randomLeft = Math.floor(Math.random() * window.innerWidth);

                    bugItem.style.position = 'absolute';
                    bugItem.style.top = `${randomTop}px`;
                    bugItem.style.left = `${randomLeft}px`;

                    bugsList.appendChild(bugItem); 

                    makeDraggable(bugItem);
                });
            })
            .catch(error => console.error('Error loading bugs:', error));
    }



    document.getElementById('bugForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const bugSeverity = document.getElementById('bugSeverity').value;
        const bugPriority = document.getElementById('bugPriority').value;
        const bugDescription = document.getElementById('bugDescription').value;
        const bugCommitLink = document.getElementById('bugCommitLink').value; 

        const token = localStorage.getItem('jwtToken');

        if (!token) {
            alert('Nu ești autentificat. Te rugăm să te autentifici.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/bugs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ severity: bugSeverity, priority: bugPriority, description: bugDescription, commitLink: bugCommitLink }),
            });

            if (!response.ok) {
                if (response.status === 403) {
                    alert('Nu ai permisiunea de a adăuga bug-uri. Doar utilizatorii cu rolul TST pot adăuga bug-uri.');
                } else {
                    const error = await response.text();
                    throw new Error(error);
                }
            }

            const data = await response.json();
            console.log('Bug adăugat cu succes:', data);
            addBugToList({ severity: bugSeverity, priority: bugPriority, description: bugDescription, commitLink: bugCommitLink });
            alert('Bug adăugat cu succes!');
            document.getElementById('bugForm').reset();
        } catch (error) {
            console.error('Eroare la adăugarea bug-ului:', error);
            alert(`A apărut o eroare: ${error.message}`);
        }
    });

    function addBugToList(bug) {
        const bugsContainer = document.getElementById('bugsList');
        if (bugsContainer) {
            const bugNote = document.createElement('div');
            bugNote.classList.add('bug-item');
            bugNote.innerHTML = `
                <strong>Severitate:</strong> ${bug.severity}<br>
                <strong>Prioritate:</strong> ${bug.priority}<br>
                <strong>Descriere:</strong> ${bug.description}<br>
                <strong>Commit:</strong> <a href="${bug.commitLink}" target="_blank">Link</a>
            `;

            const randomTop = Math.floor(Math.random() * (window.innerHeight - bugNote.clientHeight));
            const randomLeft = Math.floor(Math.random() * (window.innerWidth - bugNote.clientWidth));

            bugNote.style.position = 'absolute';
            bugNote.style.top = `${randomTop}px`;
            bugNote.style.left = `${randomLeft}px`;

            makeDraggable(bugNote);
            bugsContainer.appendChild(bugNote);
        }
    }


    function makeDraggable(element) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        element.addEventListener('mousedown', function (e) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.position = 'absolute'; 
            element.style.zIndex = '1000'; 
        });

        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                element.style.left = (e.clientX - offsetX) + 'px';
                element.style.top = (e.clientY - offsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = 'auto'; 
            }
        });
    }

    function saveToken(token) {
        console.log(`Salvarea token-ului JWT în local storage: ${token}`);
        localStorage.setItem('jwtToken', token);
    }

    function getToken() {
        return localStorage.getItem('jwtToken');
    }

    function isLoggedIn() {
        return getToken() !== null;
    }

    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        document.getElementById('registerButton').addEventListener('click', function () {
            window.location.href = 'register.html'; 
        });
    }

    let projects = JSON.parse(localStorage.getItem('projects')) || [];

    function addProjectToList(project) {
        const projectListElement = document.getElementById('projectsList');
        if (projectListElement) {
            const projectItem = document.createElement('div');
            projectItem.classList.add('project-item');
            projectItem.innerHTML = `
                <h3>${project.name}</h3>
                <p>Repository: <a href="${project.repository}" target="_blank">${project.repository}</a></p>
                <p>Echipa: ${project.team}</p>
                <p>Owner Id: ${project.current_user}</p>
            `;

            const randomTop = Math.floor(Math.random() * (window.innerHeight - projectItem.clientHeight));
            const randomLeft = Math.floor(Math.random() * (window.innerWidth - projectItem.clientWidth));

            projectItem.style.position = 'absolute';
            projectItem.style.top = `${randomTop}px`;
            projectItem.style.left = `${randomLeft}px`;

            makeDraggable(projectItem);
            projectListElement.appendChild(projectItem);
        }
    }
});


function loadBugsAndProjects() {
    if (!isLoggedIn()) {
        alert('You must be logged in to view bugs and projects!');
        return;
    }

    const token = getToken();

    fetch('http://localhost:3000/bugs-and-projects', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })
        .then(response => response.json())
        .then(data => {
            const bugsList = document.getElementById('bugsList');
            const projectsList = document.getElementById('projectsList');

            bugsList.innerHTML = '';
            projectsList.innerHTML = '';

            const bugs = data.bugs;
            const projects = data.projects;

            bugs.forEach(bug => {
                const bugItem = document.createElement('div');
                bugItem.classList.add('bug-item');
                bugItem.innerHTML = `
                <strong>Severitate:</strong> ${bug.severity}<br>
                <strong>Prioritate:</strong> ${bug.priority}<br>
                <strong>Descriere:</strong> ${bug.description}<br>
                <strong>Commit:</strong> <a href="${bug.commit_link}" target="_blank">Link</a>
            `;

                const randomTop = Math.floor(Math.random() * window.innerHeight);
                const randomLeft = Math.floor(Math.random() * window.innerWidth);

                bugItem.style.position = 'absolute';
                bugItem.style.top = `${randomTop}px`;
                bugItem.style.left = `${randomLeft}px`;

                bugsList.appendChild(bugItem);

                makeDraggable(bugItem);
            });

            projects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.classList.add('project-item');
                projectItem.innerHTML = `
                <h3>${project.name}</h3>
                <p>Repository: <a href="${project.repository}" target="_blank">${project.repository}</a></p>
                <p>Echipa: ${project.team}</p>
            `;

                const randomTop = Math.floor(Math.random() * window.innerHeight);
                const randomLeft = Math.floor(Math.random() * window.innerWidth);

                projectItem.style.position = 'absolute';
                projectItem.style.top = `${randomTop}px`;
                projectItem.style.left = `${randomLeft}px`;

                projectsList.insertBefore(projectItem, projectsList.firstChild); 

                makeDraggable(projectItem);
            });
        })
        .catch(error => console.error('Error loading bugs and projects:', error));
}

