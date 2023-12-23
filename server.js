const {ObjectId} = require('mongodb');
const express = require("express");
const bodyParser   = require('body-parser');
const app = express();
let dbo = null;
const path = require('path');

const VERBOSE = true;

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(express.static('public'));


let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/3744todolist";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(url);
let db;
let tasks;


async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    db = await client.db("todolist");
    tasks = db.collection("tasks");
    if (tasks== null){
      tasks = db.createCollection("tasks");
      console.log("Tasks collection does not exists so created");
    }
  } finally {
 //   await client.close();
  }

  
}
run().catch(console.dir);

let insertDocument = function( data, callback) {
  tasks.insertOne( data);
    if(VERBOSE)console.log("insertDocument: Inserted a document into the tasks collection. : " + data._id);
    if(callback)callback(data);
};

let updateOneDocument = function( query, newvalues, callback) {
  if(VERBOSE)console.log("updateOneDocument: query:" + JSON.stringify(query));
  if(VERBOSE)console.log("updateOneDocument: newValue:" + JSON.stringify(newvalues));
  tasks.updateOne(query,{ $set: newvalues })
  if(VERBOSE)console.log("updateOneDocument: Updated a document in tasks ");
  if(callback)callback();
};

//https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
let writeOKResponse = function(res, message, data){
  let obj = {
    status: "OK",
    message: message,
    data: data
  };
  if(VERBOSE)console.log("writeOKResponse:" + message);

  res.writeHead(200, {'Content-type': 'application/json'});
  res.end(JSON.stringify(obj));
}

let writeBadRequestResponse = function(res, message){
  if(VERBOSE)console.log("writeBadRequestResponse:" + message);
  res.writeHead(400, {'Content-type': 'text/plain'});
  res.end(message);
}

let retreiveAllDocsList = function(query, fields,sort ){
  try {
    cursor =tasks.find(query).sort(sort).project(fields);
  } catch (err) {
    if(VERBOSE)console.log("retreiveAllDocsList: retreiveAllDocsList Error\n" + err);
  }
  return cursor;
};

app.get('/fetchtasks', async function (req, res) {
  if(VERBOSE)console.log("/fetchtasks request");
  let list = retreiveAllDocsList(
    {deleted:false}
    , { _id: 1, title: 1 , completed:1, completeDate: 1, dueDate:1, note:1}
    , {createdDate: 1}
  );
  const docs = await list.toArray();
  writeOKResponse(res, "fetchtasks: Succesfully Fetched Tasks Data " + JSON.stringify(docs), docs);

});


app.post('/deletetask', function (req, res) {
  if(VERBOSE)console.log("/deletetask request");

  let task_id = req.body._id;
  if(task_id == null){
    writeBadRequestResponse(res, "deletetask: task _id not defined." + req.body);
    return;
  }

  if(task_id.length<12){
    writeBadRequestResponse(res, "deletetask: _id must be  must be a single String of 12 bytes or a string of 24 hex characters." + req.body);
    return;
  }

  updateOneDocument( {_id: new ObjectId(task_id)}, {deleted:true}, function(err){
    if(err){
      writeBadRequestResponse(res, "deletetask: Delete Document Failed" + err);
      return;
    }
    writeOKResponse(res, "deletetask: Task deleted Successfully", {_id: task_id});
  });
});

app.post('/updatetask', function (req, res) {
  if(VERBOSE)console.log("/updatetask");

  let task_id  = req.body._id; // provide the _id
  let task_data  = req.body.data;
  if(VERBOSE)console.log(task_id);
  if(VERBOSE)console.log(task_data);
  if (task_id == undefined){
    writeBadRequestResponse(res, "updatetask: _id not defined.");
    return;
  }

  if (task_data == undefined){
    writeBadRequestResponse(res, "updatetask: data for id("+task_id+") not defined.");
    return;
  }

  for (let j=0; j< Object.keys(task_data).length; j++){
    if (!["title", "dueDate", "completed", "completeDate", "note"].includes(Object.keys(task_data)[j])){
      writeBadRequestResponse(res, "updatetask: unknown update field("+Object.keys(task_data)[j]+").");
      return;
    }
  }

  if (task_data.title && typeof(task_data.title) != "string"){
    writeBadRequestResponse(res, "updatetask: title needs to be string("+task_data.title+").");
    return;
  }

  if (task_data.title && task_data.title.length == 0){
    writeBadRequestResponse(res, "updatetask: title needs to have s("+task_data.title+").");
    return;
  }

  if (task_data.completed && task_data.completed != true && task_data.completed != false ){
    writeBadRequestResponse(res, "updatetask: completed needs to be boolean("+task_data.completed+").");
    return;
  }


  if(task_data.dueDate && typeof(task_data.dueDate) != "string"){
    writeBadRequestResponse(res, "updatetask: Due date needs to be string:" + task_data.dueDate);
    return;
  }

  if(task_data.dueDate){
    if(task_data.dueDate != null && isNaN(Date.parse(task_data.dueDate))){
    
      writeBadRequestResponse(res, "updatetask: Due date ill defined:" + task_data.dueDate  + ", Parsed:" + Date.parse(task_data.dueDate));
      return;
    }
  }

  if(task_data.completeDate && typeof(task_data.completeDate) != "string"){
    writeBadRequestResponse(res, "updatetask: Complete date needs to be string:" + task_data.completeDate);
    return;
  }

  if(task_data.completeDate && isNaN(Date.parse(task_data.completeDate))){
    writeBadRequestResponse(res, "updatetask: Complete date ill defined:" + Date.parse(task_data.completeDate));
    return;
  }

  if(task_id.length<12){
    writeBadRequestResponse(res, "deletetask: _id must be  must be a single String of 12 bytes or a string of 24 hex characters." + req.body);
    return;
  }
  if(VERBOSE)console.log(task_data);

  updateOneDocument( {_id:new ObjectId(task_id)}, task_data, function(err){
    if(err){
        writeBadRequestResponse(res, "updatetask: Update Document Failed" + err);
        return;
    }
    writeOKResponse(res, "updatetask: Updated Successfully("+task_id+")", {_id: task_id});
  });
});

app.post('/newtask', function (req, res) {
  let task = req.body;
  console.log("received:",task);
  console.log("all data looks good");

  if(typeof(task.title)!="string"){
    writeBadRequestResponse(res, "newtask: No title is defined.");
    return;
  }
  console.log("all data looks good");

  if(task.title.trim().length==0){
    writeBadRequestResponse(res, "newtask: Task needs some content");
    return;
  }
  console.log("all data looks good");

  if (task.dueDate != null)
  {
    if(isNaN(Date.parse(task.dueDate))){
        writeBadRequestResponse(res, "newtask: Due date ill defined:" + Date.parse(task.dueDate));
        return;
    }
  }

  console.log("all data looks good");
  // default data.
  task.completed = false,
  task.completeDate = null,
  task.createdDate= new Date(),
  task.deleted=false;

  insertDocument(task, function(data){
    writeOKResponse(res, "newtask: Created Successfully", {_id: data._id});
  });
});

let server = app.listen(8080, function(){
    let port = server.address().port;
    if(VERBOSE)console.log("Hello! Server started at http://127.0.0.1:%s", port);
});
