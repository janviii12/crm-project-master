import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { createLog } from './logController.js';
import { createNotification } from './notificationController.js';
import activityLogger from '../middleware/activityLogger.js';

// Get io instance from app
import { io } from '../server.js';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Nodemailer transporter
const createTransporter = () => {
   console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Not Loaded ❌");
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // Use TLS if specified
    requireTLS: true,
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate random password
const generatePassword = () => crypto.randomBytes(6).toString('hex'); // 12-char hex

// Controller
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, type, serviceType, address } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }

    // Check if customer already exists by email
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      console.log(`⚠️ Customer with email ${email} already exists (ID: ${existingCustomer._id}). Creating new record instead of updating.`);
    }

    // Always create NEW customer record (don't update existing)
    // File handling for new customer
    let files = [];
    if (req.file) {
      files = [{
        filePath: path.basename(req.file.path),
        fileOriginalName: req.file.originalname,
        uploadedAt: new Date()
      }];
    }

    // Create new customer record
    const customer = new Customer({
      name,
      email,
      phone,
      type,
      serviceType,
      address,
      files,
      status: 'pending',
      submittedAt: new Date(), // Always set submittedAt for new submissions
    });
    await customer.save();

    console.log(`✅ New customer created: ${customer.name} (${customer._id})`);


    // ✅ Removed duplicate code block - now always creates new customer


    // Create user account for the customer
    try {
      const existingUser = await User.findOne({ email: customer.email });
      if (!existingUser) {
        const generatedPassword = generatePassword();
        const passwordHash = await bcrypt.hash(generatedPassword, 10);

        const user = new User({
          email: customer.email,
          passwordHash,
          role: 'client',
          name: customer.name,
        });
        await user.save();
        console.log('User account created for:', customer.email);

       // --- inside createCustomer, after user creation ---
// Send welcome email with login credentials
const transporter = createTransporter();
const welcomeSubject = 'Welcome to CRM - Your Account Details';
const welcomeMessage = `
  <p>Hi ${customer.name},</p>

  <p>Welcome to <strong>CRM System</strong>! Your registration has been received and is currently under review. You’ll hear from us within 48 hours regarding the status of your application.</p>

  <h3>Your Login Credentials</h3>
  <ul>
    <li><strong>Username:</strong> ${customer.email}</li>
    <li><strong>Password:</strong> ${generatedPassword}</li>
  </ul>

  <p><strong>Please update your password after logging in for the first time.</strong></p>

  <p>If you have any questions, feel free to contact our support team.</p>

  <p>Best regards,<br/>CRM Team</p>
`;

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: customer.email,
  subject: welcomeSubject,
  html: welcomeMessage,
};

await transporter.sendMail(mailOptions);
console.log('Welcome email with credentials sent successfully to:', customer.email);

      } else {
        console.log('User account already exists for:', customer.email);
      }
    } catch (userError) {
      console.error('Failed to create user account:', userError);
      // Don't fail the customer creation if user creation fails
    }

    // Create notification for staff/admin about new customer
    try {
      const staffUsers = await User.find({ roles: { $in: ['admin', 'manager'] } });
      for (const staff of staffUsers) {
        await createNotification(
          staff._id,
          'info',
          'New Customer Registration',
          `${customer.name} (${customer.email}) has registered for services.`,
          `/customers/${customer._id}`
        );
      }
    } catch (notificationError) {
      console.error('Failed to create staff notification:', notificationError);
    }

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });

  } catch (err) {
    console.error('createCustomer error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


// Get all customers with pagination
export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Customer.countDocuments();

    const customers = await Customer.find()
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: customers.map(customer => ({
        _id: customer._id.toString(),
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: customer.type,
        serviceType: customer.serviceType,
        status: customer.status,
        submittedAt: customer.createdAt ? customer.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        files: customer.files ? customer.files.map(file => ({
          ...file,
          filePath: file.filePath.replace(/^uploads\//, '')
        })) : (customer.filePath ? [{
          filePath: customer.filePath.replace(/^uploads\//, ''),
          fileOriginalName: customer.fileOriginalName,
          uploadedAt: customer.createdAt
        }] : []),
        remarks: customer.remarks,
        createdAt: customer.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('getCustomers error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Log the view action if user is authenticated
    if (req.user && req.user.roles && req.user.roles.length > 0) {
      await createLog(
        req.user.roles[0],
        req.user.name || req.user.email,
        req.user.id,
        customer.name,
        customer._id,
        'Viewed',
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: customer.type,
        address: customer.address,
        status: customer.status,
        createdAt: customer.createdAt,
        files: customer.files ? customer.files.map(file => ({
          ...file,
          filePath: file.filePath.replace(/^uploads\//, '')
        })) : (customer.filePath ? [{
          filePath: customer.filePath.replace(/^uploads\//, ''),
          fileOriginalName: customer.fileOriginalName,
          uploadedAt: customer.createdAt
        }] : []),
      },
    });
  } catch (err) {
    console.error('getCustomerById error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Update customer status
export const updateCustomerStatus = [
  activityLogger('status_update', (req, data) => {
    const { id } = req.params;
    const { status } = req.body;
    return `Updated customer ${id} status to ${status}`;
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const updateData = { status };
      if (remarks !== undefined) {
        updateData.remarks = remarks;
      }
      const customer = await Customer.findByIdAndUpdate(id, updateData, { new: true });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Create in-app notification for the customer
      try {
        const user = await User.findOne({ email: customer.email });
        if (user) {
          let notificationType = 'info';
          let title = 'Application Status Update';
          let message = `Your application status has been updated to: ${status}`;

          switch (status) {
            case 'verified':
              notificationType = 'success';
              title = 'Application Approved';
              message = 'Congratulations! Your application has been approved and verified.';
              break;
            case 'rejected':
              notificationType = 'error';
              title = 'Application Rejected';
              message = 'Unfortunately, your application has been rejected.';
              break;
            case 'on_hold':
              notificationType = 'warning';
              title = 'Application On Hold';
              message = `Your application is currently on hold${remarks ? `: ${remarks}` : '.'}`;
              break;
            case 'pending':
              notificationType = 'info';
              title = 'Application Under Review';
              message = 'Your application is being reviewed by our team.';
              break;
          }

          await createNotification(
            user._id,
            notificationType,
            title,
            message,
            `/application-status`
          );
        }
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the status update if notification creation fails
      }

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (err) {
      console.error('updateCustomerStatus error:', err);
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
];

// Assign work to staff
export const assignWork = [
  activityLogger('work_assignment', (req, data) => {
    const { id } = req.params;
    const { assignedStaff } = req.body;
    return `Assigned work for customer ${id} to staff ${assignedStaff}`;
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { assignedStaff, status } = req.body;
      const customer = await Customer.findByIdAndUpdate(id, { assignedStaff, status }, { new: true });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (err) {
      console.error('assignWork error:', err);
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
];

// Reassign task to different staff
export const reassignTask = [
  activityLogger('task_reassignment', (req, data) => {
    const { id } = req.params;
    const { newAssignedStaff, reason } = req.body;
    return `Reassigned task for customer ${id} to staff ${newAssignedStaff}${reason ? ` (Reason: ${reason})` : ''}`;
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newAssignedStaff, reason } = req.body;

      // Validate required fields
      if (!newAssignedStaff) {
        return res.status(400).json({ success: false, message: 'New assigned staff is required' });
      }

      // Check if user has permission (only manager and executive roles can reassign)
      if (!req.user || !req.user.roles || !req.user.roles.some(role => ['manager', 'executive'].includes(role))) {
        return res.status(403).json({ success: false, message: 'Unauthorized to reassign tasks' });
      }

      const customer = await Customer.findById(id).populate('assignedStaff');
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Check if task is assigned
      if (!customer.assignedStaff) {
        return res.status(400).json({ success: false, message: 'Task is not currently assigned' });
      }

      // Prevent reassignment to the same user
      if (customer.assignedStaff._id.toString() === newAssignedStaff) {
        return res.status(400).json({ success: false, message: 'Cannot reassign to the same staff member' });
      }

      // Check if new staff exists and has appropriate role
      const newStaff = await User.findById(newAssignedStaff);
      if (!newStaff || !['executive'].includes(newStaff.role)) {
        return res.status(400).json({ success: false, message: 'Invalid staff member selected' });
      }

      // Record reassignment in history
      const reassignmentEntry = {
        fromStaff: customer.assignedStaff._id,
        toStaff: newAssignedStaff,
        reason: reason || '',
        reassignedAt: new Date()
      };

      // Update customer with new assignment and history
      const updatedCustomer = await Customer.findByIdAndUpdate(
        id,
        {
          assignedStaff: newAssignedStaff,
          $push: { reassignmentHistory: reassignmentEntry }
        },
        { new: true }
      ).populate('assignedStaff');

      // Create notification for the new assignee
      try {
        await createNotification(
          newAssignedStaff,
          'info',
          'Task Reassigned',
          `A task for ${customer.name} has been reassigned to you${reason ? ` (Reason: ${reason})` : ''}.`,
          `/customers/${customer._id}`
        );
      } catch (notificationError) {
        console.error('Failed to create reassignment notification:', notificationError);
      }

      return res.status(200).json({
        success: true,
        message: 'Task reassigned successfully',
        data: updatedCustomer,
      });

    } catch (err) {
      console.error('reassignTask error:', err);
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
];

// Get customer by email (for client to view their own status)
export const getCustomerByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    return res.status(200).json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: customer.type,
        serviceType: customer.serviceType,
        address: customer.address,
        status: customer.status,
        submittedAt: customer.submittedAt,
        remarks: customer.remarks,
        createdAt: customer.createdAt,
        files: customer.files ? customer.files.map(file => ({
          ...file,
          filePath: file.filePath.replace(/^uploads\//, '')
        })) : (customer.filePath ? [{
          filePath: customer.filePath.replace(/^uploads\//, ''),
          fileOriginalName: customer.fileOriginalName,
          uploadedAt: customer.createdAt
        }] : []),
      },
    });
  } catch (err) {
    console.error('getCustomerByEmail error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Send email notification with detailed error handling
export const sendEmailNotification = async (req, res) => {
  console.log("🔥 sendEmailNotification API hit");
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    console.log(`📧 Attempting to send ${status} email to ${customer.email}`);

    const transporter = createTransporter();

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyErr) {
      console.error('❌ SMTP verification failed:', verifyErr.message);
      return res.status(500).json({ 
        success: false, 
        message: 'SMTP configuration error - cannot connect to email server',
        error: verifyErr.message 
      });
    }

    let subject = '';
    let message = '';

    switch (status) {
      case 'verified':
        subject = 'Application Verified - Next Steps';
        message = `
          <p>Hi ${customer.name},</p>
          <p>Congratulations! Your application has been successfully verified.</p>
          <p>Our team will contact you within the next 48 hours to guide you through the next steps.</p>
          <p>Thank you for your patience and trust in our services.</p>
          <p>Best regards,<br/>CRM Team</p>
        `;
        break;
      case 'rejected':
        subject = 'Application Status Update';
        message = `
          <p>Hi ${customer.name},</p>
          <p>We regret to inform you that your application has been rejected.</p>
          <p>If you have any questions or require assistance, please reach out to our support team.</p>
          <p>Best regards,<br/>CRM Team</p>
        `;
        break;
      case 'on_hold':
        subject = 'Application Status Update';
        message = `
          <p>Hi ${customer.name},</p>
          <p>Your application is currently on hold.</p>
          ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ''}
          <p>Our team will review it again soon and update you accordingly.</p>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br/>CRM Team</p>
        `;
        break;
      default:
        subject = 'Application Status Update';
        message = `
          <p>Hi ${customer.name},</p>
          <p>Your application status has been updated to: <strong>${status}</strong>.</p>
          <p>For any questions, feel free to contact our support team.</p>
          <p>Best regards,<br/>CRM Team</p>
        `;
    }

    const mailOptions = {
      from: `"CRM Team" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Status email sent successfully:', info.messageId, 'to:', customer.email, 'accepted:', info.accepted, 'rejected:', info.rejected, 'response:', info.response);

    if (!info.accepted || info.accepted.length === 0 || (info.rejected && info.rejected.length > 0)) {
      return res.status(502).json({
        success: false,
        message: `Email was rejected by the mail server for ${customer.email}`,
        rejected: info.rejected,
        response: info.response
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      from: process.env.EMAIL_USER
    });

  } catch (err) {
    console.error('❌ sendEmailNotification detailed error:', {
      message: err.message,
      code: err.code,
      response: err.response?.data,
      command: err.command,
      stack: err.stack
    });
    
    let userMessage = 'Failed to send email';
    if (err.code === 'EAUTH') {
      userMessage = 'Email authentication failed - check EMAIL_USER/PASS in .env';
    } else if (err.code === 'ECONNECTION') {
      userMessage = 'Cannot connect to SMTP server - check EMAIL_HOST/PORT';
    }
    
    return res.status(500).json({ 
      success: false, 
      message: userMessage,
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// Test SMTP connection endpoint
export const testEmailConnection = async (req, res) => {
  try {
    const transporter = createTransporter();
    
    // Test connection
    await transporter.verify();
    
    return res.status(200).json({
      success: true,
      message: 'SMTP connection successful!',
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true'
      }
    });
  } catch (err) {
    console.error('SMTP test failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'SMTP test failed',
      error: err.message
    });
  }
};


