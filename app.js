const express = require('express');
const bodyParser = require('body-parser');
const {mongoose}= require('./db/mongoose');
const app = express();
const jwt = require('jsonwebtoken')

const { List, Task, User } = require('./db/models') ;

const bcrypt = require('bcryptjs');

bcrypt.hash('test123', 10).then(console.log);

//Load middleware
app.use(bodyParser.json());
app.use(express.json());

// verify Refresh Token middle ware which will be verifying the session

let verifySession = (req,res, next) => {
    let refreshToken = req.header('x-refresh-token');
    let _id = req.header('_id');
    User.findByIdAndToken(_id,refreshToken).then((user)=>{
        if(!user){
            return Promise.reject({
                'error': "User not found, Make sure that refresh token and user id are correct"
            })
        }
        req.user_id = user._id;
        req.userObject = user; 
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session)=>{
            if(session.token === refreshToken){
                if(User.hasRefreshTokenExpired(session.expiresAt) === false){
                    // refresh token has not expire 
                    isSessionValid = true;
                }
            }
        })
        if(isSessionValid){
            next();
        }else{
            return Promise.reject({
                'error': "Refresh token has expired or the sessiosn is invalid"
            })
        }
    }).catch((e)=>{
        res.status(400).send(e);
    })
}

// CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );
    next();
});

// check whether request has valid JWT token 
let authenticate = (req, res, next) => {
    let token = req.header('x-refresh-token');
    // verify jwt token 
    jwt.verify(token,User.getJWTSecret(), (err,decoded)=>{
        if(err){
            res.status(401).send(err);
        }else{
            req.user_id = decoded._id;
            next();
        }
    })

}

app.get('/lists', authenticate, (req,res)=> {
    List.find({
        _userId: req.user_id
    }).then((lists)=>{
        res.send(lists)
    }).catch((e)=>{
        res.send(e)
    })
});

app.post('/lists',(req,res)=> {
    let title = req.body.title;
    let newList = new List({
        title
    });
    newList.save().then((listDoc)=>{
        res.send(listDoc)
    })
});

app.patch('/lists/:id',(req,res)=>{
    List.findOneAndUpdate({_id:req.params.id},{
        $set: req.body
    }).then(()=>{
        res.sendStatus(200);
    })
});

app.delete('/lists/:id',(req,res)=>{
    List.findOneAndDelete({
        _id: req.params.id
    }).then((removedListDoc)=> {
        res.send(removedListDoc);
    })
});


//Get all tasks from specific list
app.get('/lists/:listId/tasks', (req,res)=> {
    Task.find({
        _listId:req.params.listId
    }).then((tasks)=>{
        res.send(tasks)
    })
});

// Get specific task from a specific list

app.get('/lists/:listId/tasks/:taskId', (req, res)=>{
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task)=>{
        res.send(task)
    })
})

// create a new task in a specific list
app.post('/lists/:listId/tasks',(req,res)=>{
    let newTask = new Task({
        title: req.body.title,
        _listId: req.params.listId
    });
    newTask.save().then((newTaskDoc)=>{
        res.send(newTaskDoc)
    })
})

// update an existing task specified by taskId
app.patch('/lists/:listId/tasks/:taskId', (req,res)=>{
    Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    },{
        $set: req.body,
        new: true 
    }).then(()=> {
        res.send({message: "Updated"})
    })
})

// Remove a task in a specific list

app.delete('/lists/:listId/tasks/:taskId', (req,res)=> {
    Task.findOneAndDelete({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((removedTask)=> {
        res.send(removedTask)
    })
});


// USER ROUTES 

// signup route 
app.post('/users', (req,res)=> {
    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(()=> {
        return newUser.createSession();
    }).then((refreshToken)=> {
        // session created succesfully - refreshToken 
        // now we generate an access auth token for the user 

        return newUser.generateAccessAuthToken().then((accessToken)=> {
            return {accessToken, refreshToken}
        })
    }).then((authToken)=> {
        // now we construct and send the response to the user with their auth tokens in the header and the user object in the body 
        res
        .header('x-refresh-token', authToken.refreshToken)
        .header('x-access-token', authToken.accessToken)
        .send(newUser);
    }).catch((e)=> {
        res.status(400).send(e);
    })
})

// login route 
app.post('/users/login',(req,res)=> {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user)=> {
        return user.createSession().then((refreshToken)=> {
            // session created successfully - refreshToken returned 
            // now we generate an access auth token for the user 
            return user.generateAccessAuthToken().then((accessToken)=> {
                return {accessToken, refreshToken}
            })
        }).then((authToken)=> {
            res
            .header('x-refresh-token', authToken.refreshToken)
            .header('x-access-token', authToken.accessToken)
            .send(user);
        })
    }).catch((e)=>{
        res.status(400).send(e);
    })
})

// generate and return an access token
app.get('/users/me/access-token', verifySession, (req,res)=> {
    // now by applying verifySession middleware we know that user is authenticated 
    req.userObject.generateAccessAuthToken().then((accessToken)=>{
        res.header('x-access-token', accessToken).send({accessToken});
    }).catch((e)=>{
        res.status(400).send(e);
    })
})


app.listen(3000,()=> {
    console.log('Server listening on port 3000')
})