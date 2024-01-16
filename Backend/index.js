const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

require('./tables');

const app = express();
const PORT = 3000;
const SECRET_KEY = '6v9y$B&E)H@McQfTjWnZr4u7x!A%D*G-KaPdSgVkYp3s5v8y/B?E(H+MbQeThVmYq3t6w9z$C&F)J@NcRfUjXn2r5u8x/A?D(G+KbPeShVmYg6v9y$B&E)'; 

app.use(express.json());
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acces neautorizat' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token invalid' });
        req.user = decoded;
        next();
    });
};

app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role], function (err) {
        if (err) return res.status(400).json({ error: 'Nu s-a putut crea utilizatorul' });
        res.status(201).json({ userId: this.lastID });
    });
});

app.post('/login', (req, res) => {
    console.log("Încercare de autentificare:", req.body);  

    const { email, password } = req.body;

    db.get('SELECT id, password FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Eroare la interogarea bazei de date:', err.message); 
            return res.status(500).json({ error: 'Eroare server intern' });
        }

        if (!user || !await bcrypt.compare(password, user.password)) {
            console.log('Autentificare eșuată pentru email:', email); 
            return res.status(401).json({ error: 'Autentificare eșuată' });
        }

        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '24h' });
        console.log('Utilizator autentificat, token generat:', token); 

        res.status(200).json({ token });
    });
});


app.post('/projects', verifyToken, (req, res) => {
    const { name, repository, team, ownerId } = req.body; 
    const userId = req.user.userId;

    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).send('Error fetching user data');
        }

        // if (user.role !== 'MP') {
        //     return res.status(403).send('Doar utilizatorii cu rolul MP pot adăuga proiecte');
        // }
//       else {
            db.run('INSERT INTO projects (name, repository, team, user_id, current_user) VALUES (?, ?, ?, ?, ?)', [name, repository, team, userId, ownerId], function (err) {
                if (err) return res.status(400).json({ error: 'Nu s-a putut adăuga proiectul' });
                res.status(201).json({ projectId: this.lastID });
            });
//        }

    });
});

app.post('/bugs', verifyToken, (req, res) => {
    const { severity, priority, description, commitLink } = req.body;
    const userId = req.user.userId;

    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).send('Error fetching user data');
        }

     //   if (user.role !== 'TST') {
  //          return res.status(403).send('Doar utilizatorii cu rolul TST pot adăuga bug-uri');
      //  }
       // else {
            db.run('INSERT INTO bugs (severity, priority, description, commit_link, user_id) VALUES (?, ?, ?, ?, ?)', [severity, priority, description, commitLink, userId], function (err) {
                if (err) return res.status(400).json({ error: 'Nu s-a putut adăuga bug-ul' });
                res.status(201).json({ bugId: this.lastID });
            });
       // }

    });
});

app.get('/mybugs', verifyToken, (req, res) => {
    const userId = req.user.userId;

    db.all('SELECT * FROM bugs WHERE user_id = ?', [userId], (err, bugs) => {
        if (err) {
            console.error('Error fetching bugs:', err.message);
            return res.status(500).send('Error fetching bugs data');
        }

        res.status(200).json(bugs);
    });
});



app.get('/projects', verifyToken, (req, res) => {
    const userId = req.user.userId;

    db.all('SELECT * FROM projects WHERE user_id = ?', [userId], (err, projects) => {
        if (err) return res.status(500).json({ error: 'Eroare la preluarea proiectelor' });
        res.status(200).json(projects);
    });
});

app.get('/bugs-and-projects', verifyToken, (req, res) => {
    const userId = req.user.userId;

    db.all('SELECT * FROM bugs WHERE user_id = ?', [userId], (err, bugs) => {
        if (err) {
            console.error('Error fetching bugs:', err.message);
            return res.status(500).send('Error fetching bugs data');
        }

        db.all('SELECT * FROM projects WHERE user_id = ?', [userId], (err, projects) => {
            if (err) return res.status(500).json({ error: 'Eroare la preluarea proiectelor' });

            res.status(200).json({ bugs, projects });
        });
    });
});

app.get('/myprojects', verifyToken, (req, res) => {
    const userId = req.user.userId; 

    db.all('SELECT * FROM projects WHERE user_id = ?', [userId], (err, projects) => {
        if (err) {
            console.error('Error fetching projects:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json(projects);
    });
});

app.listen(PORT, () => {
    console.log('Serverul rulează pe portul ${PORT}');
});

app.on('close', () => {
    db.close((err) => {
        if (err) return console.error(err.message);
        console.log('Closed the SQLite database.');
    });
});