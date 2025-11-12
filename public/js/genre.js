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

 async function func (url, value){
  const response = await fetch(`${url}/api/discover?with_genres=${value}`);
  const data = await response.json();
  return data;
}

async function genre_handler(){
  const genre = localStorage.getItem("selectedGenre");
  console.log("Genre from localStorage:", genre);
  const url = 'http://localhost:3000';

  for(let type of genres){
    if(type.name === genre){
      title = document.getElementById("title");
      title.innerHTML = type.name;
      const data = await func(url, type.id);
      movies_array = data.results;
      movies_array.forEach((movie) => {
        console.log(movie);
        console.log(movie.title);
      });

      return data;

    }
  }

}

function set_Up_Page(){
  const data = genre_handler();
}
set_Up_Page();
