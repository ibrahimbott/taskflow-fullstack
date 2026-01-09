// Enhanced Test JWT Auth Endpoints
const testAuth = async () => {
    const API_BASE = 'http://localhost:8000';
    const testEmail = `test${Date.now()}@example.com`;

    console.log('=== JWT Auth API Enhanced Test ===\n');
    console.log('Testing with:', testEmail);

    // Test 1: Signup
    console.log('\n1. Testing SIGNUP...');
    try {
        const body = JSON.stringify({
            email: testEmail,
            password: 'Password123!',
            name: 'Test User'
        });
        console.log('   Request body:', body);

        const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        const signupText = await signupRes.text();
        console.log('   Status:', signupRes.status);
        console.log('   Response:', signupText);

        if (signupRes.ok) {
            const signupData = JSON.parse(signupText);
            console.log('   ✅ SIGNUP SUCCESS!');
            console.log('   Token exists:', !!signupData.token);

            // Test login right away
            console.log('\n2. Testing LOGIN with new user...');
            const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: 'Password123!'
                })
            });

            const loginText = await loginRes.text();
            console.log('   Status:', loginRes.status);
            console.log('   Response:', loginText);

            if (loginRes.ok) {
                console.log('   ✅ LOGIN SUCCESS!');
                const loginData = JSON.parse(loginText);

                // Test task creation
                console.log('\n3. Testing TASK CREATION...');
                const taskRes = await fetch(`${API_BASE}/api/tasks/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${loginData.token}`
                    },
                    body: JSON.stringify({
                        description: 'Test task via JWT',
                        category: 'Work',
                        priority: 'High'
                    })
                });

                console.log('   Status:', taskRes.status);
                const taskText = await taskRes.text();
                console.log('   Response:', taskText);

                if (taskRes.ok) {
                    console.log('   ✅ TASK CREATED!');

                    // Get tasks
                    console.log('\n4. Testing GET TASKS...');
                    const getRes = await fetch(`${API_BASE}/api/tasks/`, {
                        headers: { 'Authorization': `Bearer ${loginData.token}` }
                    });
                    console.log('   Status:', getRes.status);
                    const getTasks = await getRes.json();
                    console.log('   Tasks count:', Array.isArray(getTasks) ? getTasks.length : 'Not array');
                    if (getRes.ok) console.log('   ✅ GET TASKS SUCCESS!');
                }
            }
        } else {
            console.log('   ❌ SIGNUP FAILED');
        }
    } catch (err) {
        console.log('   ❌ ERROR:', err.message);
    }

    console.log('\n=== Test Complete ===');
};

testAuth();
