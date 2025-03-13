const https = require('https');

const products = [
    {
        name: 'Plano Inicial (Cobranca unica)',
        description: 'Adiciona mais 50 chamadas para utilizar no mes',
        priceInput: {
            currency: 'BRL',
            unitAmount: 199
        },
    },
    {
        name: 'Plano Start (Cobranca unica)',
        description: 'Adiciona mais 500 chamadas para utilizar no mes',
        priceInput: {
            currency: 'BRL',
            unitAmount: 1099
        },
    },
    {
        name: 'Plano Smart Search (Cobranca unica)',
        description: 'Adiciona mais 1500 chamadas para utilizar no mes',
        priceInput: {
            currency: 'BRL',
            unitAmount: 2499
        },
    }
]

function sendProduct(product) {
    const data = JSON.stringify(product);

    const options = {
        hostname: 'caixinha-financeira-9a2031b303cc.herokuapp.com',
        path: '/stripe/products',
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

function sendAllProducts(products) {
    products.forEach((product) => {
        sendProduct(product);
    });
}

sendAllProducts(products);

