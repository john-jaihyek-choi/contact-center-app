'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

const usersTable = process.env.USERS_TABLE;

function response (statusCode, message) {
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }
  console.log(res);
  return res;
}

module.exports.createUser = (event, context, callback) => {
  console.log("event", event);
  const reqBody = {
    phoneNumber: event.Details.Parameters.phoneNumber,
    fName: event.Details.Parameters.fName,
    lName: event.Details.Parameters.lName
  }

  if (
    !reqBody.fName ||
    reqBody.fName.trim() === '' ||
    !reqBody.lName ||
    reqBody.lName.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'User must have their first and last name.'
      })
    );
  }

  const user = {
    phoneNumber: String(reqBody.phoneNumber.match(/\d{10}$/)[0]),
    fName: reqBody.fName,
    lName: reqBody.lName,
    createdAt: new Date().toISOString(),
  }

  return db.put({
    TableName: usersTable,
    Item: user
  }).promise().then(() => {
    user.statusCode = 201;
    callback(null, user)
  })
    .catch(err => response(null, response(err.statusCode, err)));
};