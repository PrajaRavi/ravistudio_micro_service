import express from "express"
import { DeleteContact, GetAllContact, PostContact } from "../Controllers/contact.controller.js"
export const ContactRouter=express.Router()
ContactRouter.post("/post-contact-detail",PostContact)
ContactRouter.get("/get-contact-detail",GetAllContact)
ContactRouter.delete("/delete-contact-detail/:id",DeleteContact)