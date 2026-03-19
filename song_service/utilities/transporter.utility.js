import nodemailer from "nodemailer";
// const nodemailer=require('nodemailer')
// const nodemailer=require('nodemailer')
export const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "kingraviprajapati@gmail.com",
    pass: "zfdfyukrdpttyzfw",
  },
});

// module.exports=transporter
