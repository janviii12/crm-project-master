import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'blocked', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  subTasks: [subTaskSchema],
  comments: [commentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ status: 1, priority: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
