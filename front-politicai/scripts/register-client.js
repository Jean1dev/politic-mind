const https = require('https');

function register() {
        const data = JSON.stringify({
            webhookUrl: 'https://politicai.vercel.app/api/plan/confirmation'
        });
    
        const options = {
            hostname: 'caixinha-financeira-9a2031b303cc.herokuapp.com',
            path: '/client-user',
            method: 'POST',
            headers: {
                'X-API-KEY': '${TOKEN}',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
    
        const req = https.request(options, (res) => {
            let responseBody = '';
    
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
    
            res.on('end', () => {
                console.log(`Response: ${responseBody}`);
            });
        });
    
        req.on('error', (error) => {
            console.error(`Error: ${error.message}`);
        });
    
        req.write(data);
        req.end();
}

register()