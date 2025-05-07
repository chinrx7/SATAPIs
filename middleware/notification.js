const nodemailer = require('nodemailer');

module.exports.mailSend = async (address, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: 'mail.sat-solutions.com',
        port: 25,
        secure: false,
        auth: {
            user: 'chinnaphat@sat-solutions.com',
            pass: 'PP@@ssw0rd555'
        }
    });

    const mailOption = {
        from: 'portaladmin@sat-solutions.com',
        to: address,
        subject: subject,
        text: text
    }

    transporter.sendMail(mailOption, (error, info) => {
        if (error) {
            console.log(`Send mail error : ${error}`);
        } else {
            console.log(`Email sent : ${info.response}`)
        }
    })
}