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

module.exports.cityCurrentWeather = (event, context, callback) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=cerritos&appid=${process.env.OWM_API_KEY}`;

  return fetch(url)
    .then(promise => promise.json())
    .then(data => {
      const weatherInfo = {
        weather: data.weather.main,
        weatherDesc: data.weather.description,
        temp: Math.round((data.main.temp - 273.15) * (9/5) + 32),
        feelTemp: Math.round((data.main.feels_like - 273.15) * (9/5) + 32),
        humidity: humidity
      }
      callback(null, weatherInfo)
    })
    .catch(err => callback(null, response(err.statusCode, err)))
};
