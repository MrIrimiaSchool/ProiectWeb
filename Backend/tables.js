const db = require('./database');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating the users table:', err.message);
            throw err;
        }
        console.log("The 'users' table has been created successfully with 'role' column.");
    });

    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        repository TEXT,
        team TEXT,
        user_id INTEGER,
        current_user INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating the projects table:', err.message);
            throw err;
        }
        console.log("The 'projects' table has been created successfully.");
    });

    db.run(`CREATE TABLE IF NOT EXISTS bugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        severity TEXT,
        priority TEXT,
        description TEXT,
        commit_link TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating the bugs table:', err.message);
            throw err;
        }
        console.log("The 'bugs' table has been created successfully.");
    });
});
