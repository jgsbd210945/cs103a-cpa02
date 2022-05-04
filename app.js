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
const ToDoItem = require("./models/ToDoItem")
const Course = require('./models/Course')
const Schedule = require('./models/Schedule')

// *********************************************************** //
//  Loading constants
// *********************************************************** //

const apikey = "de1a5bee9e459d"

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


// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
const { deflateSync } = require("zlib");
app.use(auth)

// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  }
  else res.redirect('/login')
}

app.get("/alliances", (req, res, next) => {
    res.locals.sortedalliances = []
    res.locals.keyword = 'none'
    res.render('alliances')
});

app.post("/alliances",
async (req, res, next) =>{
  try{
    var allalliances = await axios.get("https://politicsandwar.com/api/alliances/?key=" + apikey)
    allalliances = allalliances.data.alliances // parsing it all
    const sortedalliances = allalliances.filter(aa => aa.name.includes(req.body.keyword))
    res.locals.sortedalliances = sortedalliances
    res.locals.keyword = req.body.keyword
    res.render('alliances')
  } catch(error){
    next(error)
  }
})


// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/about", (req, res, next) => {
  res.render("about");
});




/* ************************
  Loading (or reloading) the data into a collection
   ************************ */
// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection

app.get('/upsertDB',
  async (req,res,next) => {
    await Course.deleteMany({})
    for (course of courses){ 
      const {subject,coursenum,section,term}=course;
      const num = getNum(coursenum);
      course.num=num
      course.suffix = coursenum.slice(num.length)
      await Course.findOneAndUpdate({subject,coursenum,section,term},course,{upsert:true})
    }
    const num = await Course.find({}).countDocuments();
    res.send("data uploaded: "+num)
  }
)

/*
  aggregation example ...
  here we create an aggregation pipeline using the
  mongo compass aggregation tool
  and then use it to find the total number of students
  enrolled in each subject
*/
const demo4stages =

    [
      // first we add a new field, email, which is the third element of the instructor value
      { $addFields: {  email: { $arrayElemAt: [ '$instructor', 2]}}},

      // then we filter out courses with <8 students
      {$match: {  enrolled: {$gte:8}}},

      // then we group by email and find average enrollment
      {$group: {
            _id: '$email',
            courseCount: {  $avg: '$enrolled'}
        }},

      // then we sort by courseCount, decreasing
      {$sort: { 'courseCount': -1}}
    ]


const pivotDemo = 
      [
        { // then we filter out courses with <8 students
          $match: {
            'enrolled': {
              '$gte': 8
            }
          }
        }, {// then we group by email and find various enrollment stats
          $group: {
            '_id': '$instructor', 
            'courseCount': {
              '$sum': 1
            },
            'avgClassSize': {
              '$avg': '$enrolled'
            },
            'maxClassSize': {
              '$max': '$enrolled'
            },
            'minClassSize': {
              '$min': '$enrolled'
            },
            'totalEnrollment': {
              '$sum': '$enrolled'
            },
            'classes':{
              '$push': {s:'$subject',c:'$coursenum',z:'$section',t:'$term',e:'$enrolled',n:'$name'}
            }
          }
        }, // then we filter for faculty with at least 300 students total
            {$match: {
              'totalEnrollment': {
                '$gte': 300
              }
            }
          }, { // then we sort by courseCount, decreasing
          $sort: {
            'totalEnrollment': -1
          }
        }
      ]

const deptTeachingLoads = (dept) => 
      [
        { // then we filter out courses with <8 students
          $match: {
            'subject': dept,
            'enrolled':{$gt:0},
          }
        }, {// then we group by email and find various enrollment stats
          $group: {
            '_id': '$instructor', 
            'courseCount': {
              '$sum': 1
            },
            'avgClassSize': {
              '$avg': '$enrolled'
            },
            'maxClassSize': {
              '$max': '$enrolled'
            },
            'minClassSize': {
              '$min': '$enrolled'
            },
            'totalEnrollment': {
              '$sum': '$enrolled'
            },
          }
        }, { // then we sort by courseCount, decreasing
          $sort: {
            'totalEnrollment': -1
          }
        }
      ]


app.get('/demo4stages',
  async (req,res,next) => {
   try {
    const enrollments = 
      await Course.aggregate(
        demo4stages
      )
    res.json(enrollments)
   } catch(error) {
     next(error)
   }
  })

  app.get('/pivot/onInstructor',
  async (req,res,next) => {
   try {
    const enrollments = 
      await Course.aggregate(
        pivotDemo
      )
    res.json(enrollments)
   } catch(error) {
     next(error)
   }
  })


  app.get('/deptTeachingLoads/:subject',
  async (req,res,next) => {
   try {
    const enrollments = 
      await Course.aggregate(
        deptTeachingLoads(req.params.subject)
      )
    res.locals.subject = req.params.subject
    res.locals.enrollments = enrollments
    res.render('enrollmentsBySubject')
   } catch(error) {
     next(error)
   }
  })

  const smallClassDepts = 
  [
    {
      '$match': {
        'enrolled': {
          '$lt': 10
        }
      }
    }, {
      '$group': {
        '_id': '$subject', 
        'numStudents': {
          '$sum': '$enrolled'
        }
      }
    }, {
      '$sort': {
        'numStudents': -1
      }
    }
  ]


app.get('/smallclasses', 
  async (req,res,next) => {
    const data = await Course.aggregate(smallClassDepts)
    res.json(data)

})

app.get('/bigclasses/:size',
  async (req,res,next) => {
   try {
    const size = parseInt(req.params.size)
    const enrollments = 
      await Course.aggregate(
        [
          {$match:{'enrolled':{$gt:size}}},
          {$sort:{'enrolled':1}}
        ]
      )
    res.json(enrollments)
   } catch(error) {
     next(error)
   }
  })


  
app.use(isLoggedIn)

app.get('/addCourse/:courseId',
  // add a course to the user's schedule
  async (req,res,next) => {
    try {
      const courseId = req.params.courseId
      const userId = res.locals.user._id
      // check to make sure it's not already loaded
      const lookup = await Schedule.find({courseId,userId})
      if (lookup.length==0){
        const schedule = new Schedule({courseId,userId})
        await schedule.save()
      }
      res.redirect('/schedule/show')
    } catch(e){
      next(e)
    }
  })

app.get('/schedule/show',
  // show the current user's schedule
  async (req,res,next) => {
    try{
      const userId = res.locals.user._id;
      const courseIds = 
         (await Schedule.find({userId}))
                        .sort(x => x.term)
                        .map(x => x.courseId)
      res.locals.courses = await Course.find({_id:{$in: courseIds}})
      res.render('schedule')
    } catch(e){
      next(e)
    }
  }
)

app.get('/schedule/remove/:courseId',
  // remove a course from the user's schedule
  async (req,res,next) => {
    try {
      await Schedule.remove(
                {userId:res.locals.user._id,
                 courseId:req.params.courseId})
      res.redirect('/schedule/show')

    } catch(e){
      next(e)
    }
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
