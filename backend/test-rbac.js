import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Test users with different roles
const testUsers = {
  manager: { email: 'manager@test.com', password: 'password123', role: 'manager' },
  technician: { email: 'tech@test.com', password: 'password123', role: 'technician' },
  employee: { email: 'employee@test.com', password: 'password123', role: 'employee' }
};

let tokens = {};

async function createTestUsers() {
  console.log('\n📝 Creating test users...\n');
  
  for (const [role, userData] of Object.entries(testUsers)) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/signup`, {
        email: userData.email,
        password: userData.password,
        name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role: userData.role
      });
      tokens[role] = response.data.token;
      console.log(`✅ Created ${role}: ${userData.email}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === 'User already exists') {
        // User exists, try to login
        try {
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: userData.email,
            password: userData.password
          });
          tokens[role] = loginResponse.data.token;
          console.log(`✅ Logged in ${role}: ${userData.email}`);
        } catch (loginError) {
          console.error(`❌ Failed to login ${role}:`, loginError.response?.data || loginError.message);
        }
      } else {
        console.error(`❌ Failed to create ${role}:`, error.response?.data || error.message);
      }
    }
  }
}

async function testEquipmentRoutes() {
  console.log('\n🔧 Testing Equipment Routes\n');
  
  // Test: Manager can create equipment
  try {
    const response = await axios.post(
      `${BASE_URL}/equipment`,
      { name: 'Test Equipment', category: 'Test', location: 'Test Lab' },
      { headers: { Authorization: `Bearer ${tokens.manager}` } }
    );
    console.log('✅ Manager can create equipment');
  } catch (error) {
    console.error('❌ Manager cannot create equipment:', error.response?.data);
  }
  
  // Test: Technician cannot create equipment
  try {
    await axios.post(
      `${BASE_URL}/equipment`,
      { name: 'Test Equipment 2', category: 'Test' },
      { headers: { Authorization: `Bearer ${tokens.technician}` } }
    );
    console.error('❌ Technician should NOT be able to create equipment');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Technician correctly blocked from creating equipment');
    } else {
      console.error('❌ Unexpected error:', error.response?.data);
    }
  }
  
  // Test: Employee cannot create equipment
  try {
    await axios.post(
      `${BASE_URL}/equipment`,
      { name: 'Test Equipment 3', category: 'Test' },
      { headers: { Authorization: `Bearer ${tokens.employee}` } }
    );
    console.error('❌ Employee should NOT be able to create equipment');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Employee correctly blocked from creating equipment');
    } else {
      console.error('❌ Unexpected error:', error.response?.data);
    }
  }
}

async function testTeamRoutes() {
  console.log('\n👥 Testing Team Routes\n');
  
  // Test: Manager can create team
  try {
    await axios.post(
      `${BASE_URL}/teams`,
      { name: 'Test Team' },
      { headers: { Authorization: `Bearer ${tokens.manager}` } }
    );
    console.log('✅ Manager can create team');
  } catch (error) {
    console.error('❌ Manager cannot create team:', error.response?.data);
  }
  
  // Test: Technician cannot create team
  try {
    await axios.post(
      `${BASE_URL}/teams`,
      { name: 'Test Team 2' },
      { headers: { Authorization: `Bearer ${tokens.technician}` } }
    );
    console.error('❌ Technician should NOT be able to create team');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Technician correctly blocked from creating team');
    } else {
      console.error('❌ Unexpected error:', error.response?.data);
    }
  }
}

async function testRequestRoutes() {
  console.log('\n📋 Testing Request Routes\n');
  
  // Get an equipment ID first
  let equipmentId;
  try {
    const response = await axios.get(`${BASE_URL}/equipment`, {
      headers: { Authorization: `Bearer ${tokens.manager}` }
    });
    equipmentId = response.data[0]?.id;
  } catch (error) {
    console.error('❌ Failed to get equipment:', error.response?.data);
    return;
  }
  
  if (!equipmentId) {
    console.log('⚠️ No equipment found, skipping request tests');
    return;
  }
  
  // Test: Manager can create preventive request
  try {
    await axios.post(
      `${BASE_URL}/requests`,
      {
        equipment_id: equipmentId,
        type: 'preventive',
        title: 'Test Preventive Request'
      },
      { headers: { Authorization: `Bearer ${tokens.manager}` } }
    );
    console.log('✅ Manager can create preventive request');
  } catch (error) {
    console.error('❌ Manager cannot create preventive request:', error.response?.data);
  }
  
  // Test: Technician cannot create preventive request
  try {
    await axios.post(
      `${BASE_URL}/requests`,
      {
        equipment_id: equipmentId,
        type: 'preventive',
        title: 'Test Preventive Request 2'
      },
      { headers: { Authorization: `Bearer ${tokens.technician}` } }
    );
    console.error('❌ Technician should NOT be able to create preventive request');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Technician correctly blocked from creating preventive request');
    } else {
      console.error('❌ Unexpected error:', error.response?.data);
    }
  }
  
  // Test: Employee can create corrective request
  try {
    await axios.post(
      `${BASE_URL}/requests`,
      {
        equipment_id: equipmentId,
        type: 'corrective',
        title: 'Test Corrective Request'
      },
      { headers: { Authorization: `Bearer ${tokens.employee}` } }
    );
    console.log('✅ Employee can create corrective request');
  } catch (error) {
    console.error('❌ Employee cannot create corrective request:', error.response?.data);
  }
  
  // Test: Employee cannot update request status
  let requestId;
  try {
    const response = await axios.get(`${BASE_URL}/requests`, {
      headers: { Authorization: `Bearer ${tokens.employee}` }
    });
    requestId = response.data[0]?.id;
  } catch (error) {
    console.error('❌ Failed to get requests:', error.response?.data);
  }
  
  if (requestId) {
    try {
      await axios.patch(
        `${BASE_URL}/requests/${requestId}/status`,
        { status: 'in_progress' },
        { headers: { Authorization: `Bearer ${tokens.employee}` } }
      );
      console.error('❌ Employee should NOT be able to update request status');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Employee correctly blocked from updating request status');
      } else {
        console.error('❌ Unexpected error:', error.response?.data);
      }
    }
    
    // Test: Technician can update request status
    try {
      await axios.patch(
        `${BASE_URL}/requests/${requestId}/status`,
        { status: 'in_progress' },
        { headers: { Authorization: `Bearer ${tokens.technician}` } }
      );
      console.log('✅ Technician can update request status');
    } catch (error) {
      console.error('❌ Technician cannot update request status:', error.response?.data);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting RBAC Tests\n');
  console.log('Make sure your backend server is running on http://localhost:3000\n');
  
  try {
    await createTestUsers();
    await testEquipmentRoutes();
    await testTeamRoutes();
    await testRequestRoutes();
    
    console.log('\n✅ All RBAC tests completed!\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

runTests();
