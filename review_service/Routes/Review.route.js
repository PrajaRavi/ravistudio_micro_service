import express from "express"
import { DeleteReview, GetAllReview, PostReview } from "../Controllers/Review.controller.js"
import { protect } from "../Middlewares/Toke.auth.js"
export const ReviewRouter=express.Router()
ReviewRouter.post("/post-review",protect,PostReview)
ReviewRouter.delete("/delete-review/:id",protect,DeleteReview)
ReviewRouter.get("/get-all-review",protect,GetAllReview)
