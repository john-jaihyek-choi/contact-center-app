'use strict';
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
  console.log(event); // for error handling
  const phoneNumber = event.Details.Parameters.phoneNumber.match(/\d{10}$/)[0];
  const params = {
    Key: {
      phoneNumber: phoneNumber
    },
    TableName: usersTable
  }
};