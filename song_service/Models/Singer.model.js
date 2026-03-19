import mongoose from "mongoose";

const ProductScheme=new mongoose.Schema({
  name:String,
  singerimage:String,
  
})
export const SingerModel=mongoose.model("singers",ProductScheme);