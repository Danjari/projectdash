

import mongoose from 'mongoose';
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const { Schema } = mongoose;

mongoose.connect(process.env.DSN, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

/* Team Schema */
const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // The admin of the team
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // List of team members
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }], // Projects owned by the team
});

/* User Schema */
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' }, // Reference to the team
  role: { type: String, enum: ['admin', 'member'], default: 'member' }, // Role in the team
});

/* Task Schema */
const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  assignedTo: { type:String, default: null }, // Assign task to a specific user
}, { timestamps: true });

/* Project Schema */
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
    default: 'Not Started',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true }, // Reference to the owning team
  tasks: [TaskSchema], // Embedded tasks
}, { timestamps: true });

/* Plugins for URL-friendly slugs */
UserSchema.plugin(mongooseSlugPlugin, { tmpl: '<%=username%>', alwaysRecreate: false });
ProjectSchema.plugin(mongooseSlugPlugin, { tmpl: '<%=title%>' });
TeamSchema.plugin(mongooseSlugPlugin, { tmpl: '<%=name%>' });

/* Models */
const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Team = mongoose.model('Team', TeamSchema);

export { Project, User, Team };