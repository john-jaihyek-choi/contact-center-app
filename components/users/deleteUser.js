'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

const usersTable = process.env.USERS_TABLE;

function response (statusCode, message) {
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
  console.log(res); // For error handling
  return res;
}

module.exports.deleteUser = (event, context, callback) => {
  console.log(event) // For error handling
  const phoneNumber = event.Details.Parameters.phoneNumber.match(/\d{10}$/)[0];

  const params = {
    Key: {
      phoneNumber: phoneNumber,
    },
    TableName: usersTable
  };

  return db.delete(params)
    .promise()
    .then(() => callback(null, response(200, { message: 'User Deleted Successfully'})))
    .catch(err => callback(null, response(err.statusCode, err)));
};
