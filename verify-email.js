const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

async function verify() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            console.log('Error: .env file not found');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[match[1].trim()] = value;
            }
        });

        const user = envVars.GMAIL_USER;
        const pass = envVars.GMAIL_APP_PASS;

        if (!user || !pass) {
            console.log('Error: GMAIL_USER or GMAIL_APP_PASS not found in .env');
            if (user) console.log('GMAIL_USER is present');
            else console.log('GMAIL_USER is MISSING');

            if (pass) console.log('GMAIL_APP_PASS is present');
            else console.log('GMAIL_APP_PASS is MISSING');
            return;
        }

        console.log(`Checking credentials for user: ${user}`);
        // Do not log password!

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass,
            },
        });

        try {
            await transporter.verify();
            console.log('Success: Connection verified successfully!');
        } catch (err) {
            console.error('Error: Connection verification failed.');
            console.error(err.message);
            if (err.response) {
                console.error('Response:', err.response);
            }
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

verify();
