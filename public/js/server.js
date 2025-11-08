let axios = require("axios");
let express = require("express");
let app = express();
let apiFile = require("../api/env.json");
let apiKey = apiFile["api_key"]; // use this to make requests
let baseUrl = apiFile["api_url"]; // use this to make requests
let port = 3000;
let hostname = "localhost";
let { genres } = require('./genres.js');

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).send();
});

app.get("/movieInfo/:movie_id", (req, res) => {
  //console.log("Movie ID:", req.params.movie_id);
  let movieID = req.params.movie_id; // int ID of movie
  console.log("Movie ID:", movieID);
  console.log(`${baseUrl}/movie/${movieID}?api_key=${apiKey}`);

  // axios to call TMDB api with movie id in english
  axios(`${baseUrl}/movie/${movieID}?api_key=${apiKey}&language=en-US`).then(response => {
    console.log("API response received:", response.data);
    res.json(response.data); // send json blob of movie data
  }).catch(error => {
    console.log("Error when requesting ID from API", error);
    res.status(error.response.status).json({"error": error.response.data["message"]}); // error if anything goes wrong
  });
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


/*const genres = getGenres().then(genres => {
  console.log(genres.genres);
  for(let genre in genres){
    console.log(genre);
    if(genre.name === movieGenre){
      console.log(genre.id, genre.name);
    }

  }
  //3/genre/movie/list
  //3/discover/movie?
  //'https://api.themoviedb.org/3/discover/movie?&sort_by=popularity.desc&with_genres=Romance';

  async function getGenres(){
    const res = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}&language=en-US`);
    if (!res.ok){
      throw new Error("Failed: CANNOT fetch genres list");
    }
    const data = await res.json();
    console.log(data.genres);
    return data;
  }

*/








app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
