import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/crm');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      const newRoles = [];
      let isDevLead = false;
      let isChatModerator = false;

      // Migrate old roles to new roles
      for (const role of user.roles) {
        switch (role) {
          case 'staff':
            newRoles.push('manager');
            needsUpdate = true;
            break;
          case 'staff2':
            newRoles.push('executive');
            needsUpdate = true;
            break;
          case 'staff3':
            newRoles.push('executive');
            needsUpdate = true;
            break;
          case 'DeveloperChatAccess':
            newRoles.push('developer');
            needsUpdate = true;
            break;
          case 'DevLead':
            newRoles.push('developer');
            isDevLead = true;
            needsUpdate = true;
            break;
          case 'ChatModerator':
            newRoles.push('developer');
            isChatModerator = true;
            needsUpdate = true;
            break;
          default:
            // Keep admin, client, and any other roles as-is
            newRoles.push(role);
        }
      }

      // Remove duplicates
      const uniqueRoles = [...new Set(newRoles)];

      if (needsUpdate) {
        user.roles = uniqueRoles;
        user.isDevLead = isDevLead;
        user.isChatModerator = isChatModerator;
        await user.save();
        migratedCount++;
        console.log(`Migrated user ${user.email}: ${user.roles.join(', ')} (DevLead: ${isDevLead}, ChatMod: ${isChatModerator})`);
      }
    }

    console.log(`Migration completed. ${migratedCount} users updated.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration
migrateRoles();
