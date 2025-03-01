const express = require('express');
const bodyParser = require('body-parser');
const {mongoose}= require('./db/mongoose');
const app = express();

const { List, Task } = require('./db/models') ;

//Load middleware
app.use(bodyParser.json());

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

app.get('/lists',(req,res)=> {
    List.find({}).then((lists)=>{
        res.send(lists)
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


app.listen(3000,()=> {
    console.log('Server listening on port 3000')
})