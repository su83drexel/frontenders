let axios = require("axios");
let express = require("express");
let app = express();
let apiFile = require("../api/env.json");
let apiKey = apiFile["api_key"]; // use this to make requests
let baseUrl = apiFile["api_url"]; // use this to make requests
let port = 3000;
let hostname = "localhost";
const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];
//Inmutable Genres list from API

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).send();
});

//Gets all movie with this genre and stores them in an object then returns said object
app.get("/movieGenre/:movie_genre", async (req, res) => {
  let movieGenre = req.params.movie_genre;
  //if(movieGenre.inculdes(","))
  console.log("Movie Genre: ", movieGenre);
  for(let genre of genres){
      console.log(genre);
      if(genre.name === movieGenre){
        console.log(genre.id, genre.name);
        movieGenre = genre.id;
      }
    }
  console.log(`${baseUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&with_genres=${movieGenre}`);

  axios(`${baseUrl}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&with_genres=${movieGenre}`).then(response => {
    console.log("API response received: ", response.data);
    res.json(response.data);
  }).catch(error => {
    console.log("Error when resquesting genres from API", error);
    res.status(error.response.status).json({"error": error.response.data["message"]});
  });
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
