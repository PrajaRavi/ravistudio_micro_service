import mongoose from "mongoose";
const ContactSchema=new mongoose.Schema({
  name:{
    type:String,
    trim:true
  },
  email:{
    type:String,
    trim:true,
    // unique:true
  },
  contact:{
    type:String,
    trim:true,
    // unique:true,
  },
  message:{
    type:String,
    trim:true
  }
})
export const ContactModel=mongoose.model("contact",ContactSchema)