import mongoose,{Schema} from "mongoose";
const ReviewSchema=new mongoose.Schema({
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
  },
  
  message:{
    type:String,
    trim:true
  }
  
},{timeseries:true,timestamps:true})
export const ReviewModel=mongoose.model("Reviews",ReviewSchema)