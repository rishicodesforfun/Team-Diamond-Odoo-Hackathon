import { pool } from './src/db/connection.js';

async function testCalendar() {
  try {
    console.log('🔍 Testing calendar data...\n');
    
    // Check all requests
    const allRequests = await pool.query('SELECT * FROM requests');
    console.log(`Total requests in database: ${allRequests.rows.length}`);
    
    // Check requests with scheduled dates
    const scheduledRequests = await pool.query(
      'SELECT * FROM requests WHERE scheduled_date IS NOT NULL'
    );
    console.log(`Requests with scheduled dates: ${scheduledRequests.rows.length}\n`);
    
    if (scheduledRequests.rows.length > 0) {
      console.log('Scheduled requests:');
      scheduledRequests.rows.forEach(req => {
        console.log(`  - ID: ${req.id}, Title: ${req.title}, Date: ${req.scheduled_date}, Time: ${req.start_time}`);
      });
    } else {
      console.log('❌ No requests with scheduled dates found!');
      console.log('\nTo fix this, create a request with a scheduled_date and start_time.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCalendar();
