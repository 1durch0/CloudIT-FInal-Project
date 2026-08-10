const express = require("express");
const app = express();
const fs = require("fs/promises");
const path = require("path");

app.use(express.json());

let users = require("./users.json");


//database-less architecture before mongoDB implementation later on
app.post("/pages/register", async(req, res) => {
    try {
    const{name, email, password} = req.body;
    
    //input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    };
    
    const newUser = {
        name,
        email,
        password
    };

    users.push(newUser);

    const filePath = path.join(__dirname, "users.json");
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser
    });
    }
    catch (error) {
    console.error("Error saving user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
})

app.post("/pages/login", async(req, res) => {const{email, password}= req.body

})

app.get("/pages/health", async(req, res) => {const{email, password}= req.body
})