import User from "../models/User.model.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // for password hashing
//for example 123456 => SKefhjw_2jbjJB  

export const signup = async(req, res) => {
    try{
        const {name, username, email, password} = req.body; //req.body is an object that contains all the data from the form
        const existingEmail = await User.findOne({email}); // checking if email already exists
        //await means it will wait for the promise to be resolved and findOne() is for searching in database
        if(existingEmail){
            return res.status(400).json({message: "Email already exists"});
        }
        //Do the same for username
        const existingUsername = await User.findOne({username});
        if(existingUsername){
            return res.status(400).json({message: "Username already exists"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        const salt  = await bcrypt.genSalt(10);//salt means random string added to the password
        //generate salt of length 10
        const hashedPassword = await bcrypt.hash(password, salt); //hashing the password
        
        const user = new User({
            name, username, email, password: hashedPassword 
        })
        //constructor to initialize user with these data
        
        await user.save(); //Saved to user database!!!!
        res.status(201).json({message: "User created successfully"});

        // const token = jwt.sign({userID: })
    }
    catch(error){
         
    }
}
export const login = async(req, res) => {
    
}
export const logout = async(req, res) => {
    
}