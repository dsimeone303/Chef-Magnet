const responseContainer = document.getElementById("responseContainer");
responseContainer.innerhtml = "";
let images = [];
let title = [];
let source = [];
//making a HTTP GET request to the node server:

//Need to remove the fetch to get it from a database
/*
fetch ('/api/scrape')
.then(response => {
  if(!response.ok) {
    throw new Error(`HTTP error! status :${response.status}`);
  }
  return response.json();
})
.then(data => {
  images = data.data[0];
  title = data.data[1];
  source = data.data[2];
  loaded(images,title,source);
})
.catch(error => {
  console.error('error', error);
  responseContainer.textContent = 'an error occured while fetching data';
});
*/

function loaded(images, title, source) {
  for (let i = 0; i < images.length; i++) {
    const miniC = document.createElement("a");
    const minipic = document.createElement("img");
    const minih1 = document.createElement("h3");

    miniC.classList.add("minis");

    miniC.setAttribute("href", source[i]);
    minipic.setAttribute("src", images[i]);
    minih1.innerText = title[i];
    miniC.append(minipic);
    miniC.append(minih1);
    responseContainer.append(miniC);
    console.log(source[i]);
  }
}
