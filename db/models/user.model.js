const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const jwtSecret = "451283482672568792790758192148erfdfdfdefwfdwdwwfdwf7256879279";


const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    sessions: [
        {
            token: {
                type: String,
                required: true
            },
            expiresAt: {
                type: Number,
                required: true
            }
        }
    ]
});


// Instance methods 
UserSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    return _.omit(userObject, ['password','sessions']);
}

UserSchema.methods.generateAccessAuthToken = function(){
    const user = this;
    return new Promise((resolve,reject) => {
        // Create JSON web token and return it
        jwt.sign({ _id: user._id.toHexString() }, jwtSecret, {expiresIn: "15m"}, (err, token)=>{
            if(!err){
                resolve(token)
            }else{
                reject();
            }
        })

    })
}


UserSchema.methods.generateRefreshAuthToken = function(){
    return new Promise((resolve, reject)=> {
        crypto.randomBytes(64,(err,buf)=> {
            if(!err){
                let token =  buf.toString('hex');
                return resolve(token);
            }
        })
    })
}

UserSchema.methods.createSession = function(){
    let user = this;
    return user.generateRefreshAuthToken().then((refreshToken)=>{
        return saveSessionToDatabase(user,refreshToken)
    }).then((refreshToken)=> {
        return refreshToken
    }).catch((e)=> {
        return Promise.reject('Failed to save session to database.\n' + e);
    })
}

let saveSessionToDatabase = (user, refreshToken) => {
    return new Promise((resolve, reject) => {
        let expiresAt =  generateRefreshTokenExpiryTime();

        user.sessions.push({'token': refreshToken, expiresAt});
        user.save().then(()=> {
            return resolve(refreshToken);
        }).catch((e)=> {
            reject(e);
        })
    })
}

let generateRefreshTokenExpiryTime = () => {
    let daysUntilExpire = "10";
    let secondUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return ((Date.now() / 1000) + secondUntilExpire);
}