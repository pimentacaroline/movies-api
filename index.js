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

const accessLogStream = fs.createWriteStream(
	path.join('log.txt'), 
	{flags: 'a'}
);

mongoose.connect('mongodb://localhost:27017/cpdb', {useNewUrlParser:true, useUnifiedTopology:true});

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
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

// #1 Return a list of ALL movies
app.get('/movies', async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
// app.get('/movies', (req, res)=>{
//   res.status(200).json(movies);
// });

// #2 Return data about a single movie by title 
app.get('/movies/:Title', async (req, res) => {
  await Movies.findOne({Title: req.params.Title})
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
// app.get('/movies/:title', (req, res)=>{
//   const { title } = req.params;
//   const movie = movies.find(movie => movie.Title === title );

//   if (movie) {
//     res.status(200).json(movie);
//   } else {
//     res.status(400).send('no such movie')
//   }
// });

// # 3 Return data about a genre (description) by name
app.get('/movies/genre/:genreName', async (req, res) => {
  await Movies.findOne({'Genre.Name':req.params.genreName})
    .then((movie) =. {
      res.status(200).json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
// app.get('/movies/genre/:genreName', (req, res)=>{
//   const { genreName } = req.params;
//   const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

//   if (genre) {
//     res.status(200).json(genre);
//   } else {
//     res.status(400).send('no such genre')
//   }
// });

// #4 Return data about a director (bio, birth year, death year) by name
app.get('/movies/directors/:directorName', async (req, res) => {
  await Movies.findOne({'Director.Name':req.params.directorName})
    .then((movie) =. {
      res.status(200).json(movie.directorName);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
// app.get('/movies/directors/:directorName', (req, res)=>{
//   const { directorName } = req.params;
//   const director = movies.find(movie => movie.Director.Name === directorName).Director;

//   if (director) {
//     res.status(200).json(director);
//   } else {
//     res.status(400).send('no such director')
//   }
// });

// #5 Allow new users to register
app.post('/users', async (req, res) => {
  await Users.findOne({Name:req.body.Name})
  .then((user) => {
    if(user) {
      return res.status(400).send(req.body.Name + 'already exists');
    } else {
      Users
        .create ({
          Name: req.body.Name,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
        .then((user) => {res.status(201).json(user)})
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.atatus(500).send('Error: ' + error);
  });
});
// app.post('/users', (req, res)=> {
//   const newUser = req.body;

//   if (newUser.name) {
//     newUser.id = uuid.v4();
//     users.push(newUser);
//     res.status(201).json(newUser)
//   }else {
//     res.status(400).send('users need names')
//   }
// });

// #6 Allow users to update their user info (username, password, email, date of birth)
app.put('/users/:Name', async (req, res) => {
  await Users.findOneAndUpdate({Name: req.params.Name}, {$set: 
    {
      Name: req.body.Name,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  }, 
  {new: true})
  .then ((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })
});
// app.put('/users/:id', (req,res)=> {
//   const { id } = req.params;
//   const updatedUser = req.body;

//   let user = users.find( user => user.id == id);

//   if (user) {
//     user.name = updatedUser.name;
//     res.status(200).json(user);
//   } else {
//     res.status(400).send('no such user');
//   }
// });

// #7 Allow users to add a movie to their list of favorites
app.post('/users/:Name/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate({Name:req.params.Name}, {$push:{FavoriteMovies:req.params.MovieID}
  },
  {new:true})
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// app.post('/users/:id/:movieTitle', (req, res)=> {
//   const { id, movieTitle} = req.params;

//   let user = users.find(user => user.id == id);

//   if (user) {
//     user.favoriteMovies.push(movieTitle);
//     res.status(200).json(`${movieTitle} has been added to user ${id}'s array`);
//   } else {
//     res.status(400).send('no such user')
//   }
// });

// #8 Allow users to remove a movie from their list of favorites
app.delete('/users/:Name/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate({Name:req.params.Name}, {$pull:{FavoriteMovies:req.params.MovieID}
  },
  {new:true})
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// app.delete('/users/:id/:movieTitle', (req, res)=> {
//   const { id, movieTitle} = req.params;

//   let user = users.find(user => user.id == id);

//   if (user) {
//     user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
//     res.status(200).json(`${movieTitle} has been removed from user ${id}'s array`);
//   } else {
//     res.status(400).send('no such user')
//   }
// });

// #9 Allow existing users to deregister (Delete a user by name)
app.delete('/users/:Name', async (req, res) => {
  await users.findOneAndRemove({Name:req.params.Name})
    .then((user) => {
      if(!user) {
        res.status(400).send(req.params.Name + ' was not found');
      } else {
        res.status(200).send(req.params.Name + ' was deleted');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// app.delete('/users/:id', (req, res)=> {
//   const { id } = req.params;

//   let user = users.find(user => user.id == id);

//   if (user) {
//     users = users.filter( user => user.id != id);
//     res.status(200).json(`user ${id} has been deleted`);
//   } else {
//     res.status(400).send('no such user')
//   }
// });

// Create error-handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('something is not working!');
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});