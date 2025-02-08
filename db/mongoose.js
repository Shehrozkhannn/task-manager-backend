
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/TaskManager', {
    useNewUrlParser: true, 
    useUnifiedTopology: true  // ✅ Add this to avoid warnings
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((e) => {
    console.log('Error while connecting to MongoDB');
    console.log(e);
});


module.exports = {
    mongoose
}