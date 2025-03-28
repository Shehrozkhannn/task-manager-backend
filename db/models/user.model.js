const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
        return Promise.reject('Failed to save session to database.\n' + e);qe
    })
}

// MODEL METHODS (STATIC METHODS) 
UserSchema.statics.findByIdAndToken = function(_id, token){
    // find user by id and token 

    const User = this;
    return  User.findOne({
        _id,
        'sessions.token': token
    });
}

UserSchema.statics.findByCredentials = function(email, password){
    let User = this;
    return User.findOne({email}).then((user)=>{
        if(!user) return Promise.reject();
        return new Promise((resolve,reject)=> {
            bcrypt.compare(password,user.password, (err,res)=>{
                if(res) resolve(user);
                else{
                    reject();
                }
            })
        })
    })

}

UserSchema.static.hasRefreshTokenExpired = (expiresAt) => {
    let secondsSinceEpoch = Date.now() / 1000;
    if(expiresAt > secondsSinceEpoch){
        return false
    }else{
        return true
    }
}

// MIDDLEWARE 
UserSchema.pre('save', function(next){
    let user = this;
    let cosFactor = 10;

    if(user.isModified('password')){
        // if password is changed/edited run this code 

        //generate salt and hashpassword 
        bcrypt.genSalt((cosFactor,(err,salt)=>{
            bcrypt.hash(user.password, salt,(err,hash)=>{
                user.password = hash;
                next();
            })
        }))
    }else{
        next()
    }
})

// HELPER METHODS 
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


const User = mongoose.model('User', UserSchema);
module.exports =  { User };