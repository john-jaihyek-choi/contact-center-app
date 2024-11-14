'use strict';
require('dotenv').config();
const fetch = require('node-fetch')

function response (statusCode, message) {
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }
  console.log(res); // for error handling
  return res;
}

module.exports.getCurrentWeather = async (event, context, callback) => {
  console.log(event);
  const pathParam = event.Details.Parameters
  const type = pathParam.type; // "q=" for city, "zip=" for zipcode 
  const location = pathParam.location;

  const url = `https://api.openweathermap.org/data/2.5/weather?${type}${location}&appid=${process.env.OWM_API_KEY}`;

  const data = await fetch(url)
    .then(promise => promise.json())
    .then(data => data)
    .catch(err => callback(null, response(err.statusCode, err)));
    
    callback(null, {
      statusCode: 200,
      name: data.name,
      weather: data.weather[0].main,
      weatherDesc: data.weather[0].description,
      temp: Math.round((data.main.temp - 273.15) * (9/5) + 32),
      feelTemp: Math.round((data.main.feels_like - 273.15) * (9/5) + 32),
      humidity: data.main.humidity
    })
};