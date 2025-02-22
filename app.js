const express = require('express');
const bodyParser = require('body-parser');
const {mongoose}= require('./db/mongoose');
const app = express();

const { List, Task } = require('./db/models') ;

//Load middleware
app.use(bodyParser.json());

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
        res.sendStatus(200)
    })
})


app.listen(3000,()=> {
    console.log('Server listening on port 3000')
})