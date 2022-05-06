/*
  app.js -- This creates an Express webserver with login/register/logout authentication
*/

// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");
const axios = require("axios")
var MongoDBStore = require('connect-mongodb-session')(session);


// *********************************************************** //
//  Loading models
// *********************************************************** //

const Nation = require("./models/Nation")

// *********************************************************** //
//  Loading constants
// *********************************************************** //

const apikey = process.env.apikey

// *********************************************************** //
//  Connecting to the database 
// *********************************************************** //

const mongoose = require( 'mongoose' );
const mongodb_URI = 'mongodb+srv://logistics:cpa02cs103a@cluster0.4ku5p.mongodb.net/test?authMechanism=SCRAM-SHA-1'

mongoose.connect( mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
// fix deprecation warnings
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});





// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

var store = new MongoDBStore({
  uri: mongodb_URI,
  collection: 'mySessions'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

app.use(require('express-session')({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  // Boilerplate options, see:
  // * https://www.npmjs.com/package/express-session#resave
  // * https://www.npmjs.com/package/express-session#saveuninitialized
  resave: true,
  saveUninitialized: true
}));

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //

app.get("/alliances",
async (req, res, next) => {
  try {
    var totalalliances = await axios.get("https://politicsandwar.com/api/alliances/?key=" + apikey)
    totalalliances = totalalliances.data.alliances // parsing it all
    res.locals.totalalliances=totalalliances
    res.locals.sortedalliances = []
    res.locals.keyword = ""
    res.render('alliances')
  } catch(error){
    next(error)
  }
});

app.post("/alliances",
async (req, res, next) =>{
  try{
    var allalliances = await axios.get("https://politicsandwar.com/api/alliances/?key=" + apikey)
    allalliances = allalliances.data.alliances // parsing it all
    res.locals.totalalliances = allalliances
    const sortedalliances = allalliances.filter(aa => aa.name.includes(req.body.keyword))
    res.locals.sortedalliances = sortedalliances
    res.locals.keyword = req.body.keyword
    res.render('alliances')
  } catch(error){
    next(error)
  }
})

app.get("/alliance/:allianceID",
async (req, res, next) =>{
  try{
    var allalliances = await axios.get("https://politicsandwar.com/api/alliances/?key=" + apikey)
    const alliance = allalliances.data.alliances.filter(aa => aa.id == req.params.allianceID)
    res.locals.alliance = alliance[0]
    res.render('alliance')
  } catch (error) {
    next(error)
  }
})

app.get("/nationslist/:allianceID",
async (req, res, next) =>{
  try {
    var nationslist = await axios.get("https://politicsandwar.com/api/nations/?key=" + apikey + "&alliance_id=" + req.params.allianceID)
    res.locals.members = nationslist.data.nations.filter(nation => nation.allianceposition >= 2)
    res.locals.applicants = nationslist.data.nations.filter(nation => nation.allianceposition == 1)
    res.render('nationslist')
  } catch (error) {
    next(error)
  }
})


// specify that the server should render the views/alliances.ejs page for the root path
// and the alliances.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/",
async (req, res, next) => {
  try {
    var totalalliances = await axios.get("https://politicsandwar.com/api/alliances/?key=" + apikey)
    totalalliances = totalalliances.data.alliances // parsing it all
    res.locals.totalalliances=totalalliances
    res.locals.sortedalliances = []
    res.locals.keyword = ""
    res.render('alliances')
  } catch(error){
    next(error)
  }
});

app.post("/",
async (req, res, next) =>{
  try{
    var allalliances = await axios.get("https://politicsandwar.com/api/alliances/?key=" + apikey)
    allalliances = allalliances.data.alliances // parsing it all
    res.locals.totalalliances = allalliances
    const sortedalliances = allalliances.filter(aa => aa.name.includes(req.body.keyword))
    res.locals.sortedalliances = sortedalliances
    res.locals.keyword = req.body.keyword
    res.render('alliances')
  } catch(error){
    next(error)
  }
})

app.get("/RoseCities",
async (req,res,next) => {
  res.locals.citycount=-1
  res.render("RoseCities")
})

app.post("/RoseCities",
async (req,res,next) => {
  const citycount = req.body;
  const citynations = await Nation.find({Cities:citycount})
  res.locals.citynations = citynations
  res.render("RoseCities")
})

app.get("/RoseCities/:citycount",
async (req,res,next) => {
  const citycount = req.params;
  const citynations = await Nation.find({Cities:citycount})
  res.locals.citynations = citynations
  res.render("RoseCities")
})

/* ************************
  Loading (or reloading) the data into a collection
   ************************ */
// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection

app.get('/upsertDB',
  async (req,res,next) => {
    await Nation.deleteMany({})
    for (nation of nations){ 
      const {id,name,leader,timezone,cities,score,money,steel,aluminum,gasoline,munitions,uranium,food,soldiers,tanks,aircraft,ships,missiles,nukes}=nation;
      await Nation.findOneAndUpdate({id,name,leader,timezone,cities,score,money,steel,aluminum,gasoline,munitions,uranium,food,soldiers,tanks,aircraft,ships,missiles,nukes},nation,{upsert:true})
    }
    const num = await Nation.find({}).countDocuments();
    res.send("data uploaded: "+num)
  }
)

// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = process.env.PORT || "5000"; 
console.log('connecting on port '+port)

app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const { reset } = require("nodemon");
const { resourceLimits } = require("worker_threads");
const { networkInterfaces } = require("os");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
