import nodemailer from "nodemailer";

async function sendEmail({ to, cc, bcc, subject, html, attachments = [] } = {}) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.gmail,
            pass: process.env.gmailPass, 
        },
    });


    let info = await transporter.sendMail({
        from: `"Egypt Here" <${process.env.gmail}>`, // sender address
        to,
        cc,
        bcc,
        subject,
        html,
        attachments
    });

 
    return info.rejected.length ? false : true
}



export default sendEmail