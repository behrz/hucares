// Quick test script for production API
const API_BASE = 'https://hucares.onrender.com/api';

async function testAPI() {
  console.log('🔍 Testing production API...\n');
  
  // Test health endpoint
  try {
    const healthResponse = await fetch('https://hucares.onrender.com/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  
  // Test auth registration with PIN
  console.log('\n📝 Testing PIN registration...');
  try {
    const testUser = {
      username: `testuser_${Date.now()}`,
      password: '1234'
    };
    
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ PIN registration works!');
      console.log('Response:', registerData);
      
      // Test login with same PIN
      console.log('\n🔐 Testing PIN login...');
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ PIN login works!');
        console.log('User:', loginData.user);
        console.log('Has token:', !!loginData.token);
      } else {
        console.log('❌ PIN login failed:', loginData);
      }
      
    } else {
      console.log('❌ PIN registration failed:', registerData);
      
      // Check if it's still expecting old password format
      if (registerData.message && registerData.message.includes('password')) {
        console.log('🚨 Backend still uses old password validation!');
      }
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

testAPI(); 