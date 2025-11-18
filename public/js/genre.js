import {createMovieCard, genres} from "./exportfunctions.js";

 async function func (value){
  const response = await fetch(`/api/discover?with_genres=${value}`);
  const data = await response.json();
  return data;
}

async function genre_handler(){
  const genre = localStorage.getItem("selectedGenre");
  console.log("Genre from localStorage: ", genre);

  for(let type of genres){
    if(type.name === genre){
      let title = document.getElementById("title");
      title.innerHTML = type.name;
      const data = await func(type.id);
      let movies_array = data.results;
      let grid = document.getElementById("genreTable");

      //Center all images in the grid and the grid itself
      grid.style.justifyContents = "center";
      grid.style.justifyItems = "center";
      //grid.style.alignItems = "center";

      //Set up 6 imgs per row and add padding and spacing
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(6, 1fr)";
      grid.style.gap = "20px";
      grid.style.padding = "20px";

      if (movies_array.length === 0 || !grid) {
        showMessage(grid, "No results.");
      }
      else {
        const frag = document.createDocumentFragment();
        movies_array.forEach((movie) => {
          frag.appendChild(createMovieCard(movie));
        });
        grid.replaceChildren(frag);
      }
      return data;
    }
  }
}

function set_Up_Page(){
  const data = genre_handler();
}
set_Up_Page();
