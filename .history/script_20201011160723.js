'use strict';

const { default: Axios } = require("axios");

const searchURL = 'https://www.loc.gov/collections/chronicling-america/';
const mapURL = 'https://maps.googleapis.com/maps/api/geocode/json';
const apiKey = 'AIzaSyD4JIY6dhHh54lJthiwY2_QICpEXHSV7uc';
var locations = [];
var markerInfo = [];
const iconImage = 'https://maps.google.com/mapfiles/kml/shapes/library_maps.png';
const spinner = document.getElementById("spinner");

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&')
}

///this function takes in the response getNews(), loops through the response
///and gets the title, description, date, and url to page from the response. 
///Then it creates a variable 'Newspapers' to display the results
function displayResults(responseJson) {
  console.log(responseJson);
  $('.results-container').empty();
  for (let i = 0; i < responseJson.results.length; i++){
    let title = responseJson.results[i].partof_title;
    let description = responseJson.results[i].description;
    let date = responseJson.results[i].date; 
    let url = responseJson.results[i].id;
    let img = responseJson.results[i].image_url[0];
    let newspapers = `
      <div class="group" >
        <div id="results-list" class="item">
          <ul>
            <li><h3>Source Newspaper: ${title}</h3></li>
            <li><p><strong>Description:</strong> ${description}</p></li>
            <li><p><strong>Publication Date:</strong> ${date}</p></li>
            <li><h4><a href="${url}" target="_blank">See more</a></h4></li>
          </ul>
        </div>
        <div id="results-img" class="item img">
          <a href="${url}" target="_blank"><img src="${img}" alt="digital image of newspaper"></a> 
        </div>
      </div>        
      `
    $('.results-container').append(newspapers);
  }
  $('.results-container').removeClass('hidden');
  $('#map-container').removeClass('hidden');
};


function geocode(location){
  console.log("geocode function ", location)
  for(let i = 0; i < location.results.length; i++) {
    markerInfo.push({
      coords: {
        lat: location.results[0].geometry.location.lat,
        lng: location.results[0].geometry.location.lng
      },
      content: `<p>${location.results[0].formatted_address}</p>`
    });
    console.log("markerInfo ", markerInfo)
    initMap();
  }
};

/*$('#map-container').empty();*/

///this function takes in the response getNews(), loops through the response
///and gets the city and state from the response. Then it constructs a URL from the 
///parameters
function getLocations(responseJson, response){
  console.log("getLocations input ", responseJson)
  for (let i = 0; i < responseJson.results.length; i++) {
    let city = responseJson.results[i].location_city[0]
    let state = responseJson.results[i].location_state[0]
    let location = city + ' ' + state
    console.log("getLocations output ", location)
    locations.push(location)
    console.log("logactions push output ", locations)
  }
  for (let i = 0; i < locations.length; i++) {
    let loc = locations[i]
    console.log("locations array ", loc)
    const params = {
      address: loc,
      key: apiKey
    }
    console.log("params object", params)
    const queryString = formatQueryParams(params);
    const url = mapURL + '?' + queryString;
    console.log("google map ", url);
    fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);        
    })
    .then(responseJson => {
      geocode(responseJson)
    })
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);        
    })
  }
};

///this function takes in search terms, constructs a query url from the search terms///
///takes the query url and gets the response and calls dispalyResults() and searchMap() with the response.///
function getNews(searchTerm, maxResults=10) {
  console.log("search terms for getNews ", searchTerm)
  const params = {
    q: searchTerm,
    c: maxResults
  }
  const queryString = formatQueryParams(params)
  const url = searchURL + '?' + queryString + '&fo=json';
  console.log("newspaper search ", url);
  spinner.removeAttribute('hidden');
  Axios.get(url)
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  })
  .then(responseJson => {
    displayResults(responseJson)
    getLocations(responseJson)
    spinner.setAttribute('hidden', '');
  }) 
  .catch(err => {
    $('#js-error-message').text(`Something went wrong: ${err.message}`);
  })
};

function initMap(){
  var options = {
    zoom: 4,
    center: {
      lat: 39, 
      lng: -95
    }
  }
  var map = new google.maps.Map(document.getElementById('map'), options);
  for (let i = 0; i < markerInfo.length; i++){
    addMarker(markerInfo[i])
  }
  console.log("markerInfo in initMap ", markerInfo);

  function addMarker(property){
    let marker = new google.maps.Marker({
      position: property.coords,
      map: map
    })
  
    if(property.content){
      let infoWindow = new google.maps.InfoWindow({
      content: property.content
      });

      marker.addListener('click', function(){
        infoWindow.open(map, marker)
      })
    }
  }
};

function clearMarkers(addMarkers){
  addMarkers = [];
}

////this function watches for the form submit event and creates variables out of the seacrch imputs///
function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    const searchTerm = $('#js-search-term').val().split(",");
    const maxResults = $('#js-max-results').val();
    getNews(searchTerm, maxResults);
  });
  clearMarkers();
};
  
$(watchForm);
