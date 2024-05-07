import connectDB from '../DB/connection.js'
import TouristDestination from '../DB/model/TouristDestination.model.js'
import authRouter from './modules/auth/auth.router.js'
import cartRouter from './modules/cart/cart.router.js'
import cityRouter from './modules/city/city.router.js'
import orderRouter from './modules/order/order.router.js'
import userRouter from './modules/user/user.router.js'
import { asyncHandler, globalErrorHandling } from './utils/errorHandling.js'
import cors from 'cors';

const initApp = (app, express) => {

    var whitelist = ['http://127.0.0.1:3000']
        var corsOptions = {
     origin: function (origin, callback) {
     if (whitelist.indexOf(origin) !== -1) {
       callback(null, true)
      } else {
      callback(new Error('Not allowed by CORS'))
      }
  }
        };
    app.use(cors({}));
    
    //convert Buffer Data
    app.use((req,res,next)=>{
        if (req.originalUrl=="/order/webhook") {
            next();
        }else{
            express.json({})(req,res,next)
        }
    });

    //Setup API Routing 
    app.use(`/auth`, authRouter)
    app.use(`/user`, userRouter)
    app.use(`/city`, cityRouter)
    app.use(`/cart`, cartRouter)
    app.use(`/order`, orderRouter);
    app.get(`/`, (req,res,next)=>{
        res.status(200).json({message:"Welcome To E-Tourism"});
    });

    app.get("/destinations",asyncHandler(async(req,res,next)=>{

        const touristDestinations = await TouristDestination.find({})
        .populate([{
         path:'cityId',
         select:"name image"
        },{
         path:'reviews',
        }]);
        
         return res.status(200).json({touristDestinations});
    }));

    app.all('*', (req, res, next) => {
        next(new Error("In-valid Routing Plz check url  or  method"))
    })
    connectDB();
    app.use(globalErrorHandling)
}



export default initApp











