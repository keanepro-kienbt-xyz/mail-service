const express = require('express')
const path = require('path')
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

dotenv.config();
const OAuth2 = google.auth.OAuth2;

// express setup
const app = express()
const port = process.env.PORT || 3000;

// configuration
app.use(express.static('public'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// end configuration

// pages
app.get('/', (req, res) => {
    res.send(`<h1 style="width:100%; text-align:center; margin-top:10%;" >KeanePro Mail Service ${process.env.SENDER_EMAIL}</h1>`);
});

app.get('/test-mail', (req, res) => {
    res.sendFile('public/pages/test/index.html', { root: __dirname });
});

// service
app.post("/send-mail", async (req, res) => {
    const { toEmail, subject, message } = req.body;

    try {
        let transporter = await createTransporter();
        let mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: toEmail,
            subject: subject,
            html: message
        };

        // send mail with defined transport object
        let info = await transporter.sendMail(mailOptions);
        res.send({
            isSuccess: true,
            info: info
        });
    } catch (e) {
        console.log('error', e);
        res.send({
            isSuccess: false,
            info: e
        });
    }
});

app.listen(port, () => {
    console.log(`nodemailerProject is listening at http://localhost:${port}`)
})

const createTransporter = async () => {
    // 1
    const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    // 2
    oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                console.log('Failed to create access token', err);
                reject("Failed to create access token :( " + err);
            }
            resolve(token);
        });
    });

    // 3
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.SENDER_EMAIL,
            accessToken,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        },
    });

    // 4
    return transporter;
};