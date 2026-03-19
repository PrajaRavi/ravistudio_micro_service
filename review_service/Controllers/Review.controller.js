import { ReviewModel } from "../Models/Review.model.js"

export const PostReview=async (req,res,next)=>{
  let owner=req.user.id
  let {message}=req.body;
  try {
    let data=await ReviewModel.create({owner,message})
    await data.save()
    if(data)  return res.status(200).json({success:true,msg:"successfully✅✅"})
  } catch (error) {
console.log(error)
    return res.status(500).json({success:false,msg:"Internal server error"})
    
  }
}
export const DeleteReview=async (req,res,next)=>{
  try {
  let data=await ReviewModel.deleteOne({_id:req.params.id})
  if(data)  return res.status(200).json({success:true,msg:"successfully deleted✅✅"})
  } catch (error) {
console.log(error)
    return res.status(500).json({success:false,msg:"Internal server error"})

    
  }
  
    
}

export const GetAllReview=async (req,res,next)=>{
  let page=req.query.page||1;
  let limit=req.query.limit||9;
try {

  let data=await ReviewModel.find()
  .skip(page-1)
  .limit(limit)
  .lean()
  if(data)   return res.status(200).json({success:true,msg:"successfull",review:data})
 
} catch (error) {
  console.log(error)
  return res.status(500).json({success:false,msg:"error in collecting all user"})
}
}
