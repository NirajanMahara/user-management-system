/**
 * User Management System
 * Author: Nirajan Mahara
 * Student ID: C0921977
 * 
 * Description: A CRUD application for managing user information
 * Technologies Used: Node.js, Express, MongoDB Atlas, PUG, and Bootstrap.
 * 
 * Application Features:
 * - CRUD operations for user management
 * - MongoDB Atlas integration
 * - Express.js backend
 * - PUG templating
 * - Bootstrap styling
 */

// Import necessary modules
const express = require('express'); // Framework for building web applications
const mongoose = require('mongoose'); // MongoDB object modeling tool
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const path = require('path'); // Module for handling file paths
const multer = require('multer');

// Load environment variables from .env file
require('dotenv').config();

// Import User Model for interacting with user data in MongoDB
const User = require('./models/user');

// Configure multer to save files on disk with specific settings
const storage = multer.diskStorage({
    // Set the destination folder for uploads
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/profiles'); // Save in "public/uploads/profiles" directory
    },
    // Customize the filename for each uploaded file
    filename: function(req, file, cb) {
        // Generate a unique filename with a timestamp and random number to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use the original file extension and prefix the file with "profile-"
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});
// Initialize multer with the configured storage and file limits
const upload = multer({
    storage: storage, // Use the custom storage defined above
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5 MB
    },
    // Define a filter function to allow only certain file types
    fileFilter: function(req, file, cb) {
        // Define allowed file types with regular expression
        const filetypes = /jpeg|jpg|png/;
        // Check if the file's MIME type and extension match the allowed types
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        // Allow the file if both the MIME type and extension are valid
        if (mimetype && extname) {
            return cb(null, true);
        }
        // Reject the file if it is not a valid type
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Initialize Express application
const app = express();

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI, {
    // Connection options
    // useNewUrlParser: true, // Deprecated option, can be omitted in recent Mongoose versions
    // useUnifiedTopology: true, // Also deprecated
    retryWrites: true, // Enables retryable writes
    w: 'majority' // Write concern for majority acknowledgment
})
.then(() => console.log('Successfully connected to MongoDB Atlas'))
.catch((error) => {
    // Log connection errors and exit the process
    console.error('MongoDB Atlas connection error:', error);
    process.exit(1); // Exit the application on connection failure
});

// Middleware Setup
app.set('view engine', 'pug'); // Set Pug as the templating engine
app.set('views', path.join(__dirname, 'views')); // Set the directory for view templates
app.use(bodyParser.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(express.static('public')); // Serve static files from the 'public' directory

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Server Error', 
        error: 'Something went wrong!' 
    });
});

// Routes

// GET: Home page - Display all users
app.get('/', async (req, res) => {
    try {
        // Fetch users from the database sorted by last name
        const users = await User.find().sort({ lastName: 1 });
        // Render the index view with user data
        res.render('index', { 
            title: 'User Management System',
            users // Pass users to the view
        });
    } catch (err) {
        // Handle errors and render an error page
        console.error('Error fetching users:', err);
        res.status(500).render('error', { 
            error: 'Failed to retrieve users'
        });
    }
});

// GET: Display add user form
app.get('/add', (req, res) => {
    // Render the add user form
    res.render('add', { title: 'Add New User' });
});

// POST: Create new user // Modify the POST routes to handle file upload
app.post('/add', upload.single('profilePicture'), async (req, res) => {
    try {
        const userData = req.body;
        if (req.file) {
            userData.profilePicture = req.file.filename;
        }
        // Create a new user instance with the request body
        const user = new User(userData);
        // Save the new user to the database
        await user.save();
        // Redirect to the home page after successful addition
        res.redirect('/');
    } catch (err) {
        // Handle errors and re-render the add form with an error message
        console.error('Error adding user:', err);
        res.render('add', { 
            title: 'Add New User',
            error: 'Failed to add user',
            user: req.body // Preserve input data for re-rendering
        });
    }
});

// GET: Display edit user form
app.get('/edit/:id', async (req, res) => {
    try {
        // Find the user by ID
        const user = await User.findById(req.params.id);
        if (!user) {
            // Handle case where user is not found
            return res.status(404).render('error', { 
                error: 'User not found' 
            });
        }
        // Render the edit form with the found user data
        res.render('edit', { 
            title: 'Edit User',
            user // Pass user data to the view
        });
    } catch (err) {
        // Handle errors and render an error page
        console.error('Error fetching user:', err);
        res.status(500).render('error', { 
            error: 'Failed to retrieve user'
        });
    }
});

// POST: Update user
app.post('/edit/:id', upload.single('profilePicture'), async (req, res) => {
    try {
        const userData = req.body;
        if (req.file) {
            userData.profilePicture = req.file.filename;
        }
        // Update the user with the provided ID using request body
        await User.findByIdAndUpdate(req.params.id, userData);
        // Redirect to the home page after successful update
        res.redirect('/');
    } catch (err) {
        // Handle errors and re-render the edit form with an error message
        console.error('Error updating user:', err);
        res.render('edit', { 
            title: 'Edit User',
            error: 'Failed to update user',
            user: { ...req.body, _id: req.params.id } // Preserve input data with user ID
        });
    }
});

// POST: Delete user
app.post('/delete/:id', async (req, res) => {
    try {
        // Delete the user by ID
        await User.findByIdAndDelete(req.params.id);
        // Redirect to the home page after successful deletion
        res.redirect('/');
    } catch (err) {
        // Handle errors and render an error page
        console.error('Error deleting user:', err);
        res.status(500).render('error', { 
            error: 'Failed to delete user'
        });
    }
});

// test route to verify file upload restrictions
app.get('/test-upload', (req, res) => {
    res.send(`
        <form action="/test-upload" method="post" enctype="multipart/form-data">
            <input type="file" name="profilePicture">
            <button type="submit">Upload</button>
        </form>
    `);
});
app.post('/test-upload', upload.single('profilePicture'), (req, res) => {
    res.send('Upload successful: ' + req.file.filename);
});

// Start the server and listen on the specified PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // Log server start information
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});