const axios = require('axios');

const API_BASE_URL = 'http://localhost:8002/v1';

async function testLogin() {
    try {
        console.log('Testing login with user: phuocsanhtps@gmail.com');
        
        const loginResponse = await axios.post(`${API_BASE_URL}/user/login`, {
            user_account: 'phuocsanhtps@gmail.com',
            user_password: '12345678'
        });
        
        console.log('Login successful!');
        console.log('Response status:', loginResponse.status);
        console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
        
        if (loginResponse.data.data && loginResponse.data.data.tokens) {
            console.log('Access token received:', loginResponse.data.data.tokens.access_token);
            
            // Test API call with token
            const token = loginResponse.data.data.tokens.access_token;
            console.log('\nTesting API call with token...');
            
            const apiResponse = await axios.get(`${API_BASE_URL}/manage/product/type`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('API call successful!');
            console.log('API response status:', apiResponse.status);
            console.log('API response data:', JSON.stringify(apiResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Status text:', error.response?.statusText);
        console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error message:', error.message);
    }
}

testLogin();