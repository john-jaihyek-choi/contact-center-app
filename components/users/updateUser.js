'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

const usersTable = process.env.USERS_TABLE;

function response (statusCode, message) {
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
  console.log(res);
  return res;
}

module.exports.updateUser = (event, context, callback) => {
  console.log(event);
  const phoneNumber = event.Details.Parameters.phoneNumber.match(/\d{10}$/)[0];
  const { fName, lName } = event.Details.Parameters;

  const params = {
    TableName: usersTable,
    Key: {
      "phoneNumber": phoneNumber
    },
    ConditionExpression: "attribute_exists(phoneNumber)",
    UpdateExpression: "set fName = :f, lName = :l",
    ExpressionAttributeValues: {
      ":f": fName,
      ":l": lName
    },
    ReturnValue: "UPDATED_NEW"
  }
  
  return db.update(params)
    .promise()
    .then(callback(null, 'Username Updated'))
    .catch(err => {
      callback(null, response(err.statusCode, err))
    });
};