const JWT_SECRET = process.env.JWT_SECRET; // Change this to your actual secret key
const jwt = require('jsonwebtoken');
const auth = {}
const redisClient = require('../redisconnection');
const e = require('express');
auth.authenticateJWT = (req, res, next) => { 
    // Middleware to verify JWT tokens    
    const token = req.header('authorization'); // Get the JWT token from the 'Authorization' header
    let userId;
     
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
        
    }
    // extract id from the token
    extractDataFromToken(token).then((result)=>{
            userId=result;
            req.body.adminUserId=userId; //adding userId to request for audit trial.
            // checking in redis for token exist or not
            redisClient.get(`token:${userId}`, (err, storedToken) => {

                if (err) {
                  console.error('Error retrieving token from Redis:', err);
                  return res.status(500).json({ message: 'Error retrieving token from Redis' });
        
                } else if (storedToken === token) {
                  // console.log('Token is valid and available.');
                  jwt.verify(token, JWT_SECRET, (err, user) => {
                    if (err) {
                        return res.status(403).json({ message: 'Forbidden' });
                    }
                    req.user = user;
                    next();
                });
                } else {
                    console.log('Token is not valid.');
                    return res.status(403).json({ message: 'Token is not valid' });
        
                }
              });

    }).catch((error)=>{
        console.log(error);
        
    })
   
    
 
};

async function   extractDataFromToken(token) {
    const jsonResult = JSON.parse(atob(token.split('.')[1])); 
    
    return jsonResult.userId
    
  }
module.exports = { auth };




