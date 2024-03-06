const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
const port = 3000;

const client = new OAuth2Client('GOOGLE_CLIENT_ID');

// In a real application, you would store this secret securely
const secret = speakeasy.generateSecret({ length: 20 });

app.get('/', (req, res) => {
    res.send('Welcome to the OTP example with Google OAuth 2.0!');
});

// Route to generate and display QR code for OTP setup
app.get('/otp-setup', (req, res) => {
    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
        if (err) {
            res.status(500).send('Error generating QR code');
        } else {
            res.send(`
                <h1>Scan the QR Code to set up OTP</h1>
                <img src="${data_url}">
            `);
        }
    });
});

// Route to verify OTP and Google OAuth 2.0 token
app.post('/verify', express.json(), (req, res) => {
    const { token, otp } = req.body;

    // Verify Google OAuth 2.0 token
    async function verifyGoogleToken() {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: 'GOOGLE_CLIENT_ID',
            });
            const payload = ticket.getPayload();
            const userid = payload['sub'];
            console.log('User ID: ${userid}');
            return true;
        } catch (error) {
            console.error('Error verifying Google token:', error);
            return false;
        }
    }

    // Verify OTP
    const isOTPValid = speakeasy.totp.verify({
        secret: secret.base32,
        encoding: 'base32',
        token: otp,
        window: 1,
    });

    // Check if both Google token and OTP are valid
    verifyGoogleToken().then((isGoogleValid) => {
        if (isGoogleValid && isOTPValid) {
            res.send('Authentication successful!');
        } else {
            res.status(401).send('Authentication failed!');
        }
    });
});

app.listen(port, () => {
    console.log('Server is running on http:3000')//localhost:${port});
});