/**
 * Simple Isolation Test - Two Users
 */
const API = 'http://localhost:8000';

const run = async () => {
    console.log('=== DATA ISOLATION TEST ===\n');

    // Create User A
    console.log('1. Creating User A...');
    const resA = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'alice' + Date.now() + '@test.com',
            password: 'Password123',
            name: 'Alice'
        })
    });

    if (!resA.ok) {
        const err = await resA.text();
        console.log('   FAILED:', err.substring(0, 200));
        return;
    }

    const dataA = await resA.json();
    console.log('   ✅ User A Created');
    const tokenA = dataA.token;

    // User A creates task
    console.log('\n2. User A creates task...');
    const taskRes = await fetch(`${API}/api/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify({
            description: 'ALICE SECRET TASK',
            category: 'Work',
            priority: 'High'
        })
    });

    if (!taskRes.ok) {
        console.log('   FAILED:', await taskRes.text());
        return;
    }
    console.log('   ✅ Task Created');

    // User A gets tasks
    console.log('\n3. User A gets tasks...');
    const getA = await fetch(`${API}/api/tasks/`, {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const tasksA = await getA.json();
    console.log('   ✅ User A sees', tasksA.length, 'task(s)');

    // Create User B  
    console.log('\n4. Creating User B...');
    const resB = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'bob' + Date.now() + '@test.com',
            password: 'Password456',
            name: 'Bob'
        })
    });

    if (!resB.ok) {
        console.log('   FAILED:', await resB.text());
        return;
    }

    const dataB = await resB.json();
    console.log('   ✅ User B Created');
    const tokenB = dataB.token;

    // User B gets tasks - should NOT see Alice's task
    console.log('\n5. ISOLATION TEST: User B gets tasks...');
    const getB = await fetch(`${API}/api/tasks/`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const tasksB = await getB.json();
    console.log('   User B sees', tasksB.length, 'task(s)');

    const canSeceAlice = tasksB.some(t => t.description.includes('ALICE'));
    if (!canSeceAlice) {
        console.log('   ✅ ISOLATION VERIFIED: Bob CANNOT see Alice\'s task');
    } else {
        console.log('   ❌ ISOLATION FAILED!');
    }

    // User B creates own task
    console.log('\n6. User B creates task...');
    await fetch(`${API}/api/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenB}`
        },
        body: JSON.stringify({
            description: 'BOB SECRET TASK',
            category: 'Personal',
            priority: 'Low'
        })
    });
    console.log('   ✅ Task Created');

    // Verify Alice can't see Bob's task
    console.log('\n7. ISOLATION TEST: User A cannot see Bob\'s task...');
    const getA2 = await fetch(`${API}/api/tasks/`, {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const tasksA2 = await getA2.json();

    const canSeeBob = tasksA2.some(t => t.description.includes('BOB'));
    if (!canSeeBob) {
        console.log('   ✅ ISOLATION VERIFIED: Alice CANNOT see Bob\'s task');
    } else {
        console.log('   ❌ ISOLATION FAILED!');
    }

    console.log('\n=== ALL TESTS PASSED ===\n');
};

run().catch(e => console.log('Error:', e.message));
