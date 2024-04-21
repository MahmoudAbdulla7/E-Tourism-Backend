import mongoose from 'mongoose'

const connectDB  = async ()=>{
    let dbLink;
    if (process.env.MOOD=="DEV") {
        dbLink=process.env.DB_LOCAL;
    }else{
        dbLink=process.env.DB_CLOUD
    }
    return await mongoose.connect(dbLink)
    .then(res=>console.log(`DB Connected successfully on .........`))
    .catch(err=>console.log(` Fail to connect  DB.........${err} `))
}
export default connectDB;