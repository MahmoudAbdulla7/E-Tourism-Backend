export const asyncHandler =(fn)=>{
    return(req,res,next)=>{
        fn(req,res,next).catch(err=>{
            return next(new Error (err,{cause:500}))
        })
    }
}

export const globalErrorHandling =(error,req,res,next)=>{
    if (error) {
        if (process.env.MOOD=='DEV') {
            return res.status(error.cause||500).json({message:error.message ,stack:error.stack})
        }else{
            return res.status(error.cause||500).json({message:error.message})
        }
    }
}