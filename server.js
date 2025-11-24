// server.js

// Import necessary libraries
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Initialize the Express application
const app = express();
const port = 3000;

// Set EJS as the view engine and set the directory for templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure session middleware
app.use(session({
    secret: 'your_secret_key', // IMPORTANT: Replace with a random, secret string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use 'true' in a production environment with HTTPS
}));

// Middleware to parse incoming form data and JSON requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----------------------------------------------------
// Database Connection Setup (Must be before any routes)
// ----------------------------------------------------
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pratik@1817', // <--- IMPORTANT: Replace with your MySQL password
    database: 'mining_project'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

// ----------------------------------------------------
// Middleware for Authentication
// ----------------------------------------------------

// This function checks if a user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        // User is logged in, proceed to the next middleware or route handler
        next();
    } else {
        // User is not logged in, redirect them to the login page
        res.redirect('/login.html');
    }
}

// ----------------------------------------------------
// Routes for your Application
// ----------------------------------------------------

// Define a route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Protected Routes (MUST come before app.use(express.static)) ---

// Route to serve the main form page, but only if the user is authenticated
app.get('/form.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// New route to handle form submission and data storage
app.post('/submit-form', (req, res) => {
    // Check if the user is logged in before proceeding
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized: Please log in to submit a form.');
    }

    const formData = req.body;
    const userId = req.session.userId; // Get the user ID from the session

    // The SQL query is now updated to match the fields in your handover_logs table
    // It now includes a 'submitted_by_user_id' column
    const sql = `INSERT INTO handover_logs (
        date, time, outgoing_shift, outgoing_leader_first_name, outgoing_leader_last_name,
        emergency_equipment_status, hsse_incidents, permits_status, isolations_overrides_suppressions,
        reappraisal_needed, simops_issues, mocs_implemented, abnormal_operation_modes,
        changes_during_shift, changes_next_shift, equipment_availability_issues, personal_issues,
        general_communications, log_complete, briefing_leaders, briefing_workers, adequate_time,
        distraction_free_location, work_area_inspections, reappraisal_performed, leader_discussed_info,
        leader_signed_log, suggestions_for_improvement, incoming_shift, incoming_leader_first_name,
        incoming_leader_last_name, submitted_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        formData.date, formData.time, formData.outgoing_shift, formData.outgoing_leader_first_name,
        formData.outgoing_leader_last_name, formData.emergency_equipment_status, formData.hsse_incidents,
        formData.permits_status, formData.isolations_overrides_suppressions, formData.reappraisal_needed,
        formData.simops_issues, formData.mocs_implemented, formData.abnormal_operation_modes,
        formData.changes_during_shift, formData.changes_next_shift, formData.equipment_availability_issues,
        formData.personal_issues, formData.general_communications, formData.log_complete,
        formData.briefing_leaders, formData.briefing_workers, formData.adequate_time,
        formData.distraction_free_location, formData.work_area_inspections, formData.reappraisal_performed,
        formData.leader_discussed_info, formData.leader_signed_log, formData.suggestions_for_improvement,
        formData.incoming_shift, formData.incoming_leader_first_name, formData.incoming_leader_last_name,
        userId // Add the user ID to the values array
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting form data:', err);
            return res.status(500).send('Error submitting form data.');
        }
        console.log('Form data inserted:', result);
        res.redirect('/dashboard'); // Redirect to the dashboard after successful submission
    });
});

// New route to handle user registration (sign-up)
app.post('/register', async (req, res) => {
    try {
        const { username, first_name, last_name, password, role } = req.body;
        
        console.log('Received sign-up data:', req.body);

        // First, check if the username already exists
        const checkUserSql = `SELECT * FROM users WHERE username = ?`;
        db.query(checkUserSql, [username], async (err, results) => {
            if (err) {
                console.error('Error checking for existing user:', err);
                return res.status(500).send('Internal server error.');
            }

            if (results.length > 0) {
                // If user exists, redirect back with an error message
                return res.redirect('/signup.html?error=duplicate');
            }

            // If user doesn't exist, proceed with creation
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = `INSERT INTO users (username, first_name, last_name, password, role) VALUES (?, ?, ?, ?, ?)`;
            const values = [username, first_name, last_name, hashedPassword, role];

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error inserting user data:', err);
                    return res.status(500).send('Error creating user. Please try a different Employee ID.');
                }
                console.log('New user created successfully:', result);
                res.redirect('/login.html');
            });
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Internal server error.');
    }
});

// New route to handle user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM users WHERE username = ?`;
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Internal server error.');
        }

        if (results.length === 0) {
            // Redirect with an error parameter if user is not found
            return res.redirect('/login.html?error=invalid');
        }

        const user = results[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            req.session.userId = user.id;
            req.session.role = user.role;
            console.log('User logged in successfully:', user.username);
            res.redirect('/dashboard'); // Redirect to the new dashboard
        } else {
            // Redirect with an error parameter if password doesn't match
            res.redirect('/login.html?error=invalid');
        }
    });
});


// New route to handle user logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/login.html');
    });
});


// New route for the dashboard page (EJS template)
app.get('/dashboard', isAuthenticated, (req, res) => {
    const { search, date } = req.query; // Get search and date from query parameters

    // Determine the base SQL query based on the user's role
    let sql = `SELECT * FROM handover_logs`;
    const queryParams = [];

    // Add filtering based on search and date if they exist
    if (req.session.role === 'manager') {
        let whereClauses = [];
        if (search) {
            // Add a clause to search across multiple fields
            whereClauses.push(`(outgoing_shift LIKE ? OR outgoing_leader_first_name LIKE ? OR outgoing_leader_last_name LIKE ?)`);
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (date) {
            whereClauses.push(`date = ?`);
            queryParams.push(date);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(' AND ');
        }
    } else { // Operator
        let whereClauses = [`submitted_by_user_id = ?`];
        queryParams.push(req.session.userId);

        if (search) {
            whereClauses.push(`(outgoing_shift LIKE ? OR outgoing_leader_first_name LIKE ? OR outgoing_leader_last_name LIKE ?)`);
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (date) {
            whereClauses.push(`date = ?`);
            queryParams.push(date);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(' AND ');
        }
    }

    // Add ordering
    sql += ` ORDER BY created_at DESC`;

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching logs:', err);
            return res.status(500).send('Error retrieving logs.');
        }
        
        // Render the 'dashboard.ejs' template and pass the fetched data
        res.render('dashboard', { logs: results, role: req.session.role, search: search, date: date });
    });
});

// NEW route to view a single log's details
app.get('/log/:id', isAuthenticated, (req, res) => {
    const logId = req.params.id;
    const sql = `SELECT * FROM handover_logs WHERE id = ?`;
    db.query(sql, [logId], (err, results) => {
        if (err) {
            console.error('Error fetching log details:', err);
            return res.status(500).send('Error retrieving log details.');
        }
        if (results.length === 0) {
            return res.status(404).send('Log not found.');
        }
        // Render a new EJS template to display the single log
        res.render('log_details', { log: results[0] });
    });
});

// --- Public Routes (serve static files for public access) ---
// This middleware now comes after your protected routes
app.use(express.static(path.join(__dirname)));


// ----------------------------------------------------
// Start the Server
// ----------------------------------------------------
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
