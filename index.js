/**
 * Setup of the Express application and middleware.
 */
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');
const {check, validationResult} = require('express-validator');

const Movies = Models.Movie;
const Users = Models.User;
const app = express();

const accessLogStream = fs.createWriteStream(
	path.join('log.txt'), 
	{flags: 'a'}
);

mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser:true, useUnifiedTopology:true});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('common'));
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

/**
 * Get a welcome message for the movie app.
 *
 * @name Welcome Message
 * @route {GET} /
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {string} - A welcome message for the movie app
 */
app.get('/', (req, res) => {
  res.send('Welcome to my movie app.');
});

/**
 * Get a list of all movies.
 *
 * @name Get All Movies
 * @route {GET} /movies
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object[]} - An array of movie objects
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get data about a single movie by title.
 *
 * @name Get Movie by Title
 * @route {GET} /movies/:Title
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Title - The title of the movie to retrieve data for
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing movie details
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({Title: req.params.Title})
    .then((movie) => {
      res.status(200).json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get data about a genre by name.
 *
 * @name Get Genre Data
 * @route {GET} /movies/genre/:genreName
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.genreName - The name of the genre to retrieve data for
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing genre details
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({'Genre.Name':req.params.genreName})
    .then((movie) => {
      res.status(200).json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get data about a director (bio, birth year, death year) by name.
 *
 * @name Get Director Data
 * @route {GET} /movies/directors/:directorName
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.directorName - The name of the director to retrieve data for
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing director details
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({'Director.Name':req.params.directorName})
    .then((movie) => {
      res.status(200).json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Register a new user.
 *
 * @name User Registration
 * @route {POST} /users
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.body.Username - The desired username for the new user
 * @param {string} req.body.Password - The password for the new user
 * @param {string} req.body.Email - The email address for the new user
 * @param {string} [req.body.Birthday] - The birthday of the new user (optional)
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing user details for the newly registered user
 * @throws {Object} - JSON object with validation errors or an error message if registration fails
 */
app.post('/users', [
  check('Username', 'Username is required').isLength({min:5}),
  check('Username', 'Username contains non alphanumeric chacters - not allowed').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
  let errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  let hashedPassword = Users.hashPassword(req.body.Password);

  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user)})
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
        }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/**
 * Update user information (username, password, email, date of birth).
 *
 * @name Update User
 * @route {PUT} /users/:Username
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Username - The username of the user to update
 * @param {string} req.body.Username - The updated username (optional)
 * @param {string} req.body.Password - The updated password (optional)
 * @param {string} req.body.Email - The updated email address (optional)
 * @param {string} req.body.Birthday - The updated date of birth (optional)
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing updated user details
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.put('/users/:Username', 
  passport.authenticate('jwt', { session: false }), 
  (req, res) => {
    
    if(req.user.Username !== req.params.Username){
      return res.status(400).send('Permission denied.');
    }

    let data = {
      Username: req.body.Username,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
    if (req.body.Password){
      let hashedPassword = Users.hashPassword(req.body.Password);
      data['Password']= hashedPassword;
    }

    Users.findOneAndUpdate({ Username: req.params.Username }, 
    { $set: data},
    { new: true }) 
    .then(updatedUser => {
        res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Add a movie to the list of favorite movies for a user.
 *
 * @name Add Movie to Favorites
 * @route {POST} /users/:Username/movies/:MovieID
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Username - The username of the user
 * @param {string} req.params.MovieID - The ID of the movie to add to favorites
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing updated user details with the added movie to favorites
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $push: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Remove a movie from the list of favorite movies for a user.
 *
 * @name Remove Movie from Favorites
 * @route {DELETE} /users/:Username/movies/:MovieID
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Username - The username of the user
 * @param {string} req.params.MovieID - The ID of the movie to remove from favorites
 * @param {Object} res - Express response object
 * @returns {Object} - JSON object containing updated user details with the removed movie from favorites
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Deregister (delete) an existing user.
 *
 * @name Deregister User
 * @route {DELETE} /users/:Username
 * @authentication This route requires JWT authentication.
 * @function
 * @param {Object} req - Express request object
 * @param {string} req.params.Username - The username of the user to deregister
 * @param {Object} res - Express response object
 * @returns {string} - A success or error message indicating the result of the deregistration
 * @throws {Object} - JSON object with an error message if an error occurs
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


/**
 * Global error-handling middleware.
 *
 * @name Global Error Handler
 * @function
 * @middleware
 * @param {Object} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('something is not working!');
});

/**
 * Start the server and listen for incoming requests on a specified port.
 *
 * @name Start Server
 * @function
 * @param {number} port - The port number on which the server will listen
 * @param {string} [hostname='0.0.0.0'] - The hostname or IP address on which the server will listen
 * @callback callback - A function to be called once the server is listening
 * @returns {void}
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});