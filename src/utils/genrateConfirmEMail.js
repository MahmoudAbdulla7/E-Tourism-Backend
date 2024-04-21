import {generateToken,verifyToken} from './GenerateAndVerifyToken.js'
import sendEmail from './email.js';
const generateConfirmEmail =(email,req)=>{
    const confirmationToken = generateToken({payload:{email},expireIn:60*5});
    const newConfirmToken =generateToken({payload:{email},expireIn:60*60*24});
    const confirmaionUrl =`${req.protocol}://${req.headers.host}/auth/confirmEmail/${confirmationToken}`;
    const rqustNewConfirmMailUrl= `${req.protocol}://${req.headers.host}/auth/requestNewConfirmMail/${newConfirmToken}`;
    const unsubscribeUrl =`${req.protocol}://${req.headers.host}/auth/unsubscribe/${newConfirmToken}`;
    const html= `<a href="${confirmaionUrl}">click me and confirm your email</a>
                <br/>
                <br/>
                <a href="${rqustNewConfirmMailUrl}">click me and request new confirmaion email</a>
                <br/>
                <br/>
                <a href="${unsubscribeUrl}">click me and delete account</a>
                `;
    return sendEmail({to:email,subject:"Confirm Email",html});
};

export default generateConfirmEmail;