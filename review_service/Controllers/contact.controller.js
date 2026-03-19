import {ContactModel} from "../Models/contact.model.js"

export const GetAllContact=async (req,res,next)=>{
  let page=req.query.page||1;
  let limit=req.query.limit||9;
try {

  let data=await ContactModel.find()
  .skip(page-1)
  .limit(limit)
  .lean()
  if(data)   return res.status(200).json({success:true,msg:"successfull",contact:data})
 
} catch (error) {
  console.log(error)
  return res.status(500).json({success:false,msg:"error in collecting all user"})
}
}

export const PostContact=async(req,res,next)=>{
  let {name,email,contact,message}=req.body;
  try {
    let data=await ContactModel.create({name,email,contact,message})
    await data.save()
  return res.status(200).json({success:true,msg:"successfull!!"})
    
    
  } catch (error) {
    console.log(error)
  return res.status(500).json({success:false,msg:"error in posting the contact detail"})
    
  }
}

export const DeleteContact=async(req,res,next)=>{
  let ContactId=req.params.id;
  try {
    let data=await ContactModel.deleteOne({_id:ContactId})
    if(data)
      return res.status(200).json({success:true,msg:"successfully!! deleted⚔️⚔️"})
    
    
  } catch (error) {
    console.log(error)
  return res.status(500).json({success:false,msg:"error in posting the contact detail"})
    
  }
}


