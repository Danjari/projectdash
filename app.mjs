import './config.mjs';
import './db.mjs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Project,User,Team } from './db.mjs';
import nodemailer from 'nodemailer';
import hbs from 'hbs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'hbs');

const isAdmin = (req, res, next) => {
  const { role } = req.user; // Extract role from JWT
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
  }
  next();
};
const authenticate = (req, res, next) => {
  const token = req.cookies?.auth_token; // Extract the token from cookies
  if (!token) {
    res.redirect("/login");
    //return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    // console.log("token received",token)
    // console.log("Secret Key",process.env.JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode the token
    req.user = decoded; // Attach decoded user info to req.user
    next(); // Proceed to the next middleware (usually isAdmin)
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.redirect("/login")
    //return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
  }
};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



// Redirect root to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});


// task page
app.get('/task/create/:projectId', authenticate, async (req, res) => {
  try {
    const { teamId } = req.user; // Get the team ID from the authenticated user
    const team = await Team.findById(teamId).populate('members');

    if (!team) {
      return res.status(404).send('Team not found');
    }

    const teamMembers = team.members.map(member => ({
      _id: member._id,
      name: member.username,
      email: member.email,
    }));

    res.render('task', { projectId: req.params.projectId, teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).send('Error fetching team members');
  }
});

// Project creation page
app.get('/project/create',authenticate,isAdmin, (req, res) => {
  res.render('project');
});

// Task creation logic
app.post('/task/create', async (req, res) => {
  const { name, description, deadline, status, projectId, assignee } = req.body;


  try {
    const userAssigned = await User.findById(assignee);
    if (!userAssigned){
      return res.status(404).send("Assigned User not Found")
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).send('Project not found');
    }
   

    const newTask = {
      name,
      description,
      deadline: new Date(deadline),
      status: status || 'not-started',
      assignedTo: userAssigned.username,
    };

    project.tasks.push(newTask);
    await project.save();

    // Prepare and send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userAssigned.email,
      subject: 'New Task Added to Your Project',
      html: `
        <h1>Task Added: ${name}</h1>
        <p>Description: ${description}</p>
        <p>Deadline: ${new Date(deadline).toLocaleDateString()}</p>
        <p>Status: ${status}</p>
        <p>Check your dashboard for more details!</p>
        <p>Click  <a href="${process.env.FRONTEND_URL}/project/${projectId}">here</a></p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    //console.log('Task saved successfully:', newTask);
    res.redirect(`/project/${projectId}`);
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).send('Error creating task');
  }
});

// Project creation logic
app.post('/project/create',authenticate, async (req, res) => {
  const { title, description, deadline } = req.body;
  try {
    const {teamId} = req.user;
    const newProject = new Project({
      title,
      description,
      startDate: new Date(),
      deadline: new Date(deadline),
      status: 'Not Started',
      priority: 'Medium',
      team:teamId,
    });
    await newProject.save();
    await Team.findByIdAndUpdate(teamId, { $push: { projects: newProject._id } });
    console.log('Project saved successfully:', newProject);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error creating project:', error.message);
    res.status(500).send('Error creating project');
  }
});

// Dashboard logic
app.get('/dashboard',authenticate, async (req, res) => {
  console.log('Dashboard route executed');
  const { teamId } = req.user; // Extract teamId from JWT

  try {
    const team = await Team.findById(teamId).populate({
      path: 'projects',
      populate: { path: 'tasks' },
    });

    if (!team) {
      //res.redirect("/login");
      return res.status(404).json({ success: false, message: 'Team not found' });
      
    }
    console.log('Team projects:', team.projects); 
    res.render('dashboard', { projects: team.projects });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).send('Error fetching dashboard');
  }
});

// View project details
app.get('/project/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).send('Project not found');
    }
    res.render('project-page', { project });
  } catch (error) {
    console.error('Error fetching project:', error.message);
    res.status(500).send('Error fetching project');
  }
});

// Delete a project
app.delete('/project/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Project.findByIdAndDelete(id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Error deleting project' });
  }
});

// Update Task Status

// Register the 'eq' helper
hbs.registerHelper('eq', (a, b) => a === b);

app.patch('/project/:projectId/task/:taskId/status', async (req, res) => {
  const { projectId, taskId } = req.params;
  const { status } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = status; // Update the status
    await project.save();

    res.json({ success: true, message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Error updating task status:', error.message);
    res.status(500).json({ success: false, message: 'Error updating task status' });
  }
});

app.patch('/project/:projectId/status', async (req, res) => {
  console.log("request received from patch for project ID: ", req.params.projectId)
  const { projectId } = req.params;
  const { status } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Update the status of the project
    project.status = status;
    await project.save();

    res.json({ success: true, message: 'Project status updated successfully' });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ success: false, message: 'Error updating project status' });
  }
});

// Delete a task
app.delete('/project/:projectId/task/:taskId', async (req, res) => {
  const { projectId, taskId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.tasks = project.tasks.filter((task) => task._id.toString() !== taskId);
    await project.save();

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting task' });
  }
});


app.get('/register', (req, res) => {
  res.render('register'); // Render the `register.hbs` view
});



app.post('/register', async (req, res) => {
  const { username, email, password, teamName } = req.body;

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user first without assigning a team
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin', // Set the user as the admin
    });
    const savedUser = await newUser.save();

    // Create the team with the admin field set to the user's ID
    const newTeam = new Team({
      name: teamName,
      admin: savedUser._id, // Set the current user as the admin
      members: [savedUser._id], // Add the admin to the members list
    });
    const savedTeam = await newTeam.save();

    // Update the user with the team ID
    savedUser.team = savedTeam._id;
    await savedUser.save();

    //res.status(201).json({ success: true, message: 'User registered and team created', user: savedUser });
    res.redirect('/login')
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error });
  }
});


app.get('/login', (req, res) => {
  res.render('login'); // Render the login.hbs view
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email }).populate('team');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('login', { error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, teamId: user.team?._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // For simplicity, store the token in a cookie
    res.cookie('auth_token', token, { httpOnly: true, secure: false,sameSite: 'lax'});

    res.redirect('/dashboard'); // Redirect to dashboard on successful login
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('login', { error: 'Something went wrong. Please try again.' });
  }
});

app.get('/teams', authenticate, async (req, res) => {
  const { teamId } = req.user; // Extract teamId from the authenticated user

  try {
    // Fetch the team and populate members
    const team = await Team.findById(teamId).populate('members', 'username email role');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Pass a flag to check if the user is an admin
    const isAdmin = req.user.role === 'admin';
    res.render('teams', { team, isAdmin }); // Render the 'teams' view with team details
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ success: false, message: 'Error fetching team details', error });
  }
});


app.post('/invite',authenticate, isAdmin, async (req, res) => {
  const { email } = req.body; // Email of the invitee
  const { id: adminId } = req.user; // Admin ID from JWT
  try {
    const admin = await User.findById(adminId).populate('team');
    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team admins can invite members' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Team Invitation',
      html: `
        <p>You have been invited to join the team: ${admin.team.name}</p>
        <p>Click <a href="${process.env.FRONTEND_URL}/join-team/${admin.team._id}">here</a> to join.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.redirect("/teams");
    //res.status(200).json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending invitation', error });
  }
});

// Render the registration page for joining a team
app.get('/join-team/:teamId', async (req, res) => {
  const { teamId } = req.params;

  try {
    // Check if the team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).send('Team not found');
    }
    

    // Render the registration page and pass the teamId
    res.render('join-team', { teamName: team.name, teamId });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).send('Error fetching team');
  }
});

app.post('/join-team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { username, email, password } = req.body;

  try {
    // Check if the team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and add them to the team
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      team: team._id,
      role: 'member',
    });
    const user = await newUser.save();

    // Add the user to the team's members
    team.members.push(user._id);
    await team.save();

    res.redirect('/dashboard')
    //res.status(201).json({ success: true, message: 'User joined the team successfully', user });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ success: false, message: 'Failed to join team', error });
  }
});

// Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port', process.env.PORT || 3000);
});

export default app;