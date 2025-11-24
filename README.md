🚧 ShiftSync: Digital Shift Handover & Safety Log System 🚧

ShiftSync is a full-stack web application designed to modernize the critical shift handover process in coal mining operations. By replacing outdated paper logs with a secure, centralized digital system, it ensures operational continuity, enhances safety compliance, and creates an auditable record of all site activities.

✨ Key Features & Technical Accomplishments

Secure Authentication: Implemented user registration and login using Node.js and industry-standard bcrypt hashing for password security.

Role-Based Access Control (RBAC): Enforces data segmentation: Managers view all logs (SELECT *), while Operators only view their own submissions (SELECT * WHERE submitted_by_user_id = ?).

Auditability & Traceability: Utilizes a Foreign Key relationship (submitted_by_user_id) in the MySQL database to create an immutable audit trail, linking every log entry to the responsible operator.

Data Integrity & Security: Queries are built using Parameterized Statements (Prepared Statements) to strictly prevent SQL Injection attacks.

Dynamic Dashboard: Built with EJS templating, the dashboard allows users to view, search, and filter logs instantly based on date and keywords.

🛠️ Technology Stack

Component

Technology

Role

Backend Runtime

Node.js

Fast, non-blocking execution environment.

Web Framework

Express.js

Handles routing, middleware, and API endpoints.

Database

MySQL

Secure, relational storage for auditable log data.

Security

bcrypt

Password hashing library.

Templating

EJS

Generates dynamic HTML for the dashboard.

⚙️ Local Setup and Execution

To run this project locally, you must have Node.js and MySQL installed.

1. Database Setup (MySQL)

Access your MySQL shell and create the required database and tables. The submitted_by_user_id field is crucial for RBAC and traceability.

# 1. Create Database
CREATE DATABASE mining_project;

# 2. Select Database
USE mining_project;

# 3. Create Handover Logs Table
CREATE TABLE handover_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- ... (30+ columns for log data)
    submitted_by_user_id INT, -- Foreign Key for auditability
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    -- ...
);

# 4. Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- Stores bcrypt hash
    role VARCHAR(50),      -- 'operator' or 'manager'
    first_name VARCHAR(255),
    last_name VARCHAR(255)
);


2. Install Dependencies

In your project directory, install the required Node.js modules:

npm install express mysql2 bcrypt express-session ejs


3. Configure Credentials (Security)

Security Note: Before running, you must create a copy of your server.js file (e.g., server_local.js) and manually add your MySQL password to the connection string. DO NOT commit this file to GitHub.

4. Run the Server

Start the application:

node server.js


The application will be accessible at http://localhost:3000.