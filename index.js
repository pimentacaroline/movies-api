const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const app = express();

mongoose.connect('mongodb://localhost:27017/cpdb', {useNewUrlParser:true, useUnifiedTopology:true});

app.use(bodyParser.json());

const accessLogStream = fs.createWriteStream(
	path.join('log.txt'), 
	{flags: 'a'}
);

//Serv static file
app.use(express.static('public'));

// setup the logger
app.use(morgan('common'));

//users
let users = [
{
  id: 1,
  name: "Kim",
  favoriteMovies: []
},
{
  id: 2,
  name: "Joe",
  favoriteMovies: ["The French Dispatch"] 
}
];


//movies
let movies = [
	{
    "Title": "The French Dispatch",
    "Description": "A love letter to journalists set in an outpost of an American newspaper in a fictional twentieth century French city that brings to life a collection of stories published in \"The French Dispatch Magazine\".",
    "Genre": {
      "Name": "Comedy",
      "Description": "Is a genre of fiction that consists of discourses or works intended to be humorous or amusing by inducing laughter."
    },
    "Director": {
      "Name": "Wes Anderson",
      "Bio": "Wesley Wales Anderson was born in Houston, Texas. During childhood, Anderson also began writing plays and making super-8 movies. Anderson attended the University of Texas in Austin, where he majored in philosophy. It was there that he met Owen Wilson. They became friends and began making short films, some of which aired on a local cable-access station.",
      "Birth": 1969.0
    },
    "ImageURL": " ",
    "Featured": false
  }
];

// CREATE - allow users to register
app.post('/users', (req, res)=> {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser)
  }else {
    res.status(400).send('users need names')
  }

});

//UPDATE - Allow users to update their user info (username)
app.put('/users/:id', (req,res)=> {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find( user => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('no such user');
  }
});

//CREATE - Allow users to add a movie to their list of favorites 
app.post('/users/:id/:movieTitle', (req, res)=> {
  const { id, movieTitle} = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).json(`${movieTitle} has been added to user ${id}'s array`);
  } else {
    res.status(400).send('no such user')
  }
});

//DELETE - Allow users to remove a movie from their list of favorites
app.delete('/users/:id/:movieTitle', (req, res)=> {
  const { id, movieTitle} = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
    res.status(200).json(`${movieTitle} has been removed from user ${id}'s array`);
  } else {
    res.status(400).send('no such user')
  }
});

//DELETE - Allow existing users to deregister
app.delete('/users/:id', (req, res)=> {
  const { id } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    users = users.filter( user => user.id != id);
    res.status(200).json(`user ${id} has been deleted`);
  } else {
    res.status(400).send('no such user')
  }
});

//READ - return a list of all movies 
app.get('/movies', (req, res)=>{
  res.status(200).json(movies);
});

//READ - return data about a single movie by name
app.get('/movies/:title', (req, res)=>{
  const { title } = req.params;
  const movie = movies.find(movie => movie.Title === title );

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('no such movie')
  }
});

//READ - return data about a genre by name
app.get('/movies/genre/:genreName', (req, res)=>{
  const { genreName } = req.params;
  const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('no such genre')
  }
});

//READ - return data about a director by name 
app.get('/movies/directors/:directorName', (req, res)=>{
  const { directorName } = req.params;
  const director = movies.find(movie => movie.Director.Name === directorName).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('no such director')
  }
});

// Create error-handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('something is not working!');
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});