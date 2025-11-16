const http = require('http');

function testEndpoint(path, description) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`\n${description}:`);
                    console.log(`  Status: ${res.statusCode}`);
                    if (Array.isArray(json)) {
                        console.log(`  Count: ${json.length}`);
                        if (json.length > 0) {
                            console.log(`  First item:`, json[0]);
                        }
                    } else {
                        console.log(`  Response:`, json);
                    }
                } catch(e) {
                    console.log(`  Error parsing JSON:`, e.message);
                    console.log(`  Raw:`, data.substring(0, 200));
                }
                resolve();
            });
        }).on('error', (e) => {
            console.log(`  Error: ${e.message}`);
            resolve();
        });
    });
}

async function runTests() {
    console.log('Testing API endpoints...');
    console.log('======================');
    
    await testEndpoint('/api/stores', 'GET /api/stores');
    await testEndpoint('/api/inventory?store_id=1', 'GET /api/inventory (store 1)');
    await testEndpoint('/api/inventory?store_id=4', 'GET /api/inventory (store 4)');
    await testEndpoint('/api/locations?store_id=1', 'GET /api/locations (store 1)');
    await testEndpoint('/api/inventory/inactive?store_id=1', 'GET /api/inventory/inactive (store 1)');
    
    console.log('\n\nDone!');
}

runTests();
