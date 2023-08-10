const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(
	path.join('log.txt'), 
	{flags: 'a'}
);

//Serv static file
app.use(express.static('public'));

// setup the logger
app.use(morgan('common'));

//My top 10 movies
let topMovies = [
	{
    title: 'The French Dispatch (2021)',
    director: 'Wes Anderson'
  },
  {
    title: 'The Grand Budapest Hotel (2014)',
    director: 'Wes Anderson'
  },
  {
    title: 'Black Cat, White Cat (1998)',
    director: 'Emir Kusturica'
  },
	{
    title: 'Moonrise Kingdom (2012)',
    director: 'Wes Anderson'
  },
	{
    title: 'Underground (1995)',
    director: 'Emir Kusturica'
  },
	{
    title: 'Run Lola Run (1998)',
    director: 'Tom Tykwer'
  },
	{
    title: 'City of God (2002)',
    director: 'Fernando Meirelles'
  },
	{
    title: 'Everything Everywhere All at Once (2022)',
    director: 'Daniel Kwan and Daniel Scheinert'
  },
	{
    title: 'Dr. Strangelove (1964)',
    director: 'Stanley Kubrick'
  },
  {
    title: 'The Life Aquatic with Steve Zissou (2004)',
    director: 'Wes Anderson'
  }
];

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to my top 10 movies!');
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
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