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

});


app.listen(3000,()=> {
    console.log('Server listening on port 3000')
})