'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

const usersTable = process.env.USERS_TABLE;

function response (statusCode, message) {
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }
  console.log(res); // for error handling
  return res;
}

module.exports.getUser = (event, context, callback) => {
  console.log(event); // for error handling
  const phoneNumber = event.Details.Parameters.phoneNumber.match(/\d{10}$/)[0];
  const params = {
    Key: {
      phoneNumber: phoneNumber
    },
    TableName: usersTable
  }

  return db.get(params).promise()
    .then(res => {
      if(res.Item) {
        res.Item.statusCode = 200;
        callback(null, res.Item);
      }
      else callback(null, response(404, { error: "User Not Found"}))
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};