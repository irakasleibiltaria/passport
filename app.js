var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , GoogleStrategy = require('passport-google').Strategy;


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));




var app = express.createServer();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
});


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve redirecting
//   the user to google.com.  After authenticating, Google will redirect the
//   user back to this application at /auth/google/return
app.get('/auth/google',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

// GET /auth/google/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {

    // console.log(req.user);
    // console.log("req.user.emails[0].value:" + req.user.emails[0].value);
    authorizated(req.user.emails[0].value, res)

    // console.log("######### /auth/google/return:" + req.user.emails[0].value);

/*
    if (req.user.emails[0].value == "user@gmail.com") {
      console.log("OK!!!!!!!!!!!!!!!!")
    }

    res.redirect('/');
*/
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/loginerror', function(req, res){
  res.render('loginerror', { user: req.user });
});

app.listen(3000);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

// is a authorizated user?
// read from google drive
// http://mynixworld.wordpress.com/2013/02/23/transparently-download-from-google-drive/
// http://nodejs.org/api/http.html
// http://nodejs.org/api/https.html
// https://github.com/mikeal/request

function authorizated(user, res) {

  var request = require('request');
  request.get({url:'https://googledrive.com/host/0B_Sg5u85ykaTLUc3TU9CRnFDT2M', json:true}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("user:" + user);
      console.log(body.emails[0].email);

      // console.log("body.user.emails[0].value:" + body.emails[0].value);

      if (body.emails[0].email == user) {
        console.log("OK!!!!!!!!!!!!!!!!");
        res.redirect('/');
      } else {
        console.log("KO!!!!!!!!!!!!!!!!");
        res.redirect('/loginerror');
      }
    }
  })

/*
  var https = require('https');

  var options = {
    hostname: 'googledrive.com',
    port: 443,
    path: '/host/0B_Sg5u85ykaTLUc3TU9CRnFDT2M',
    method: 'GET'
  };

  var req = https.request(options, function(res) {
    // console.log("statusCode: ", res.statusCode);
    // console.log("headers: ", res.headers);

    var str = '';
    res.on('data', function(d) {
      //process.stdout.write(d);
      str += d;
    });

    console.log(str);
  });

  req.end();

  req.on('error', function(e) {
    console.error(e);
  });

  return str;
*/
}
