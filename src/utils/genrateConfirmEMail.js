import {generateToken,verifyToken} from './GenerateAndVerifyToken.js'
import sendEmail from './email.js';
const generateConfirmEmail =(email,req)=>{
    const confirmationToken = generateToken({payload:{email},expireIn:60*5});
    const newConfirmToken =generateToken({payload:{email},expireIn:60*60*24});
    const confirmaionUrl =`${req.protocol}://${req.headers.host}/auth/confirmEmail/${confirmationToken}`;
    const rqustNewConfirmMailUrl= `${req.protocol}://${req.headers.host}/auth/requestNewConfirmMail/${newConfirmToken}`;
    const unsubscribeUrl =`${req.protocol}://${req.headers.host}/auth/unsubscribe/${newConfirmToken}`;
    const html= `
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Confirmation</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; margin: 10px; padding: 10px;">
  <div style="max-width: 400px; margin: 1rem auto; background-color: #ffffff; padding: 1rem; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 1rem;">
      <h2 style="margin: 0; font-size: 1.25rem; color: #131550;">Egypt Here</h2>
    </div>
    <div style="background-color: #131550; padding: 1rem; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 1.5rem;">Email Confirmation</h1>
    </div>
    <div style="margin: 1rem 0; text-align: center;">
      <p style="margin: 0 0 1rem 0; line-height: 1.6;">Hello,</p>
      <p style="margin: 0 0 1rem 0; line-height: 1.6;">Please confirm your email by clicking the button below.</p>
      <a href="${confirmaionUrl}" style="display: inline-block; padding: 0.5rem 1rem; margin: 0.5rem; font-size: 0.875rem; font-weight: bold; text-align: center; text-decoration: none; color: #ffffff; background-color: #4CAF50; border-radius: 4px; cursor: pointer;">Confirm Email</a>
      <p style="margin: 0 0 1rem 0; line-height: 1.6;">If you did not receive the email, you can request a new confirmation by clicking the button below.</p>
      <a href="${rqustNewConfirmMailUrl}" style="display: inline-block; padding: 0.5rem 1rem; margin: 0.5rem; font-size: 0.875rem; font-weight: bold; text-align: center; text-decoration: none; color: #ffffff; background-color: #FFA500; border-radius: 4px; cursor: pointer;">Request New Confirmation</a>
      <p style="margin: 0 0 1rem 0; line-height: 1.6;">If you wish to delete your account, click the button below.</p>
      <a href="${unsubscribeUrl}" style="display: inline-block; padding: 0.5rem 1rem; margin: 0.5rem; font-size: 0.875rem; font-weight: bold; text-align: center; text-decoration: none; color: #ffffff; background-color: #FF0000; border-radius: 4px; cursor: pointer;">Unsubscribe</a>
    </div>
    <div style="margin-top: 1rem; text-align: center; color: #777777; font-size: 0.75rem;">
 
    </div>
  </div>
</body>
</html>
`;
    return sendEmail({to:email,subject:"Confirm Email",html});
};

export default generateConfirmEmail;