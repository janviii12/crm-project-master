import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Add indexes to collections
const addIndexes = async () => {
  try {
    console.log('Adding database indexes...');

    // Customer collection indexes
    const Customer = mongoose.connection.db.collection('customers');
    await Customer.createIndex({ email: 1 }, { name: 'email_index' });
    console.log('✓ Created email index on customers collection');

    await Customer.createIndex({ status: 1 }, { name: 'status_index' });
    console.log('✓ Created status index on customers collection');

    await Customer.createIndex({ assignedStaff: 1 }, { name: 'assignedStaff_index' });
    console.log('✓ Created assignedStaff index on customers collection');

    // Log collection indexes
    const Log = mongoose.connection.db.collection('logs');
    await Log.createIndex({ timestamp: -1 }, { name: 'timestamp_index' });
    console.log('✓ Created timestamp index on logs collection');

    await Log.createIndex({ userId: 1 }, { name: 'userId_index' });
    console.log('✓ Created userId index on logs collection');

    console.log('All indexes added successfully!');
  } catch (error) {
    console.error('Error adding indexes:', error);
    throw error;
  }
};

// Test query performance
const testQueryPerformance = async () => {
  try {
    console.log('Testing query performance...');

    const Customer = mongoose.connection.db.collection('customers');
    const Log = mongoose.connection.db.collection('logs');

    // Test customer queries
    console.log('Testing customer queries:');
    const customerQuery = { status: 'active' };
    const customerExplain = await Customer.find(customerQuery).explain('executionStats');
    console.log('Customer status query execution stats:', {
      totalDocsExamined: customerExplain.executionStats.totalDocsExamined,
      totalDocsReturned: customerExplain.executionStats.totalDocsReturned,
      executionTimeMillis: customerExplain.executionStats.executionTimeMillis,
      indexesUsed: customerExplain.executionStats.winningPlan?.inputStage?.indexName || 'No index used'
    });

    // Test log queries
    console.log('Testing log queries:');
    const logQuery = { userId: { $exists: true } };
    const logExplain = await Log.find(logQuery).sort({ timestamp: -1 }).limit(10).explain('executionStats');
    console.log('Log timestamp query execution stats:', {
      totalDocsExamined: logExplain.executionStats.totalDocsExamined,
      totalDocsReturned: logExplain.executionStats.totalDocsReturned,
      executionTimeMillis: logExplain.executionStats.executionTimeMillis,
      indexesUsed: logExplain.executionStats.winningPlan?.inputStage?.indexName || 'No index used'
    });

    console.log('Query performance testing completed!');
  } catch (error) {
    console.error('Error testing query performance:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log('CRM Database Index Management Script');
  console.log('=====================================');

  await connectDB();

  try {
    await addIndexes();
    await testQueryPerformance();
    console.log('Database optimization completed successfully!');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { addIndexes, testQueryPerformance };
