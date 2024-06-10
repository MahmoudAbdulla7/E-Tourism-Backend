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
<html>
<head>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<style type="text/css">
  body {
    background-color: #000000;
    padding: 15px;
  }
</style>
<body style="margin:0px;">
  <table border="0" width="30%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
    <tr>
      <td>
        <table border="0" width="100%">
          <tr>
            <td>
              <h1>
                <p style="color:#192180">Epypt Here</p>
              </h1>
            </td>
            <td>
              <p style="text-align: right;"></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
          <tr>
            <td style="background-color: rgb(19 21 80);height:100px;font-size:50px;color:#fff;">
              <img style="background-color: rgb(19 21 80);" width="50px" height="50px" src="https://t3.ftcdn.net/jpg/04/40/47/24/360_F_440472452_akYtD3QipsLo9IwGEintusNRPO09rAFH.jpg">
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="padding-top:25px; color:#192180">Email Confirmation</h1>
            </td>
          </tr>
          
          <tr>
            <td>
              <p style="padding:0px 100px;">
              </p>
            </td>
          </tr>
          
          
          <tr>
            <td>
              <a href="${confirmaionUrl}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:rgba(19,21,80,1); text-decoration: none;">Confirm your Email</a>
            </td>
         </tr>
          <td>
          <br>
          <br>
          </td>
       </tr>
            <tr>
            <td>
              <a href="${rqustNewConfirmMailUrl}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:rgba(19,21,80,1); text-decoration: none; "> Request new Confirm email</a>
            </td>
         </tr>
           <tr>
          <td>
          <br>
          <br>
          </td>
       </tr>
           <tr>
            <td>
              <a href="${unsubscribeUrl}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:rgba(19,21,80,1); text-decoration: none;">Delete Account</a>
            </td>
         </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
          <tr>
            <td>
              <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
            </td>
          </tr>
          <tr>
            <td>
              </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
    return sendEmail({to:email,subject:"Confirm Email",html});
};

export default generateConfirmEmail;