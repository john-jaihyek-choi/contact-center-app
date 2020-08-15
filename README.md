Contact Center App
======================

Interactive phone contact center application built utilizing Amazon Connect, DynamoDB, Lambda, Node.js

## Table of content

- [Resources](#resources,tools,and-runtime-used)
- [Notes](#notes)
- [Key Features](#key-features)
- [Live Demo](#live-demo)
- [Dial Manual](#dial-manual)
- [DynamoDB Table](#dynamodb-tables)
- [Lambda Functions](#lambda-functions)
- [Getting Started](#getting-started)
    - [Clone repository](##clone-repository)
    - [Install dependencies](##install-dependencies)
    - [Environment setup](##environment-setup)
    - [Deploy lambda functions](##deploy-lambda-functions)
    - [Exporting Amazon Connect Contact Flows](##exporting-amazon-connect-contact-flows)
    - [Add amazon Connect Instance](##add-amazon-connect-instance)
    - [Set up Routing Profile and Agent Profile](##set-up-routing-profile-and-agent-profile)
    - [Configuring your Amazon Connect for Lambda and Lex](##configuring-your-amazon-connect-for-lambda-and-lex)
    - [Final tweeks](##final-tweeks)
    - [Finalize and publish contact flow](##finalize-and-publish-contact-flow)


## Resources, tools, and runtime used
- [Amazon Connect](https://aws.amazon.com/connect/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Amazon DynamoDB](https://aws.amazon.com/dynamobd/)
- [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/)
- [Amazon API Gateway](https://aws.amazon.com/api-gateway/)
- [Amazon Lex](https://aws.amazon.com/lex/)
- [Node.js](https://nodejs.org/en/)
- [Serverless](https://www.serverless.com/)


## Notes
- [Google drive notes]()


## Key Features
- Caller is greeted with names on profile
- Caller can direct their call to Sales, Customer Service, and Technical Support representatives through DTMF
- Caller can be placed on a customer queue until the representative becomes available
- Caller can leave a callback number in a callback queue if no other representatives are online
- Caller can create, read, update, delete their profile
- Caller can retrieve current weather information based on their DTMF/Amazon Lex input
    - Possible Input:
        - By city
        - By zip
- Caller can transfer directly to John


## Dial Manual
- Press 1 / 2 / 3:
    - Caller can join customer queue if there are currently available Sales representatives
    - When there are no available representatives:
        - Press 1:
            - Caller can leave their callback number to be placed in callback queue
        - Press 2:
            - Caller can hang up
- Press 4:
    - Caller navigates to the Profile menu flow
        - Press 1: Caller can create a new profile
        - Press 2: Caller can update an existing profile
        - Press 3: Caller can delete an existing profile
        - Press 4: Caller can return to the main menu
- Press 5:
    - Caller navigates to the Bonus Features menu
        - Press 1: Caller can get current weather of desired city
- Press 0:
    - Caller is directly transferred to John's personal number


## DynamoDB Table
- This application uses single DynamoDB Table usersTable:
    - userTable stores users' phone number and name information and is primarily used for dynamic greeting

#### Table Attributes
Attribute Name | Attribute Type | Primary Key | Description
--- | --- | --- | ---
phoneNumber | String | Yes | Users' phone number
fName | String | No | User's first name
lName | String | No | User's last name

#### Example Table
phoneNumber (String) | fName (String) | lName (String)
--- | --- | ---
562xxxxxxx | Spongebob | Squarepants
213xxxxxxx | Bob | TheBuilder
909xxxxxxx | Coding | John


## Lambda Functions
- This application uses multiple AWS Lambda functions which hits the REST API to affect the DynamoDB usersTable

#### helper function (response)
```javascript
function response (statusCode, message) {
  const res = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }
  console.log(res);
  return res;
}
```

#### createUser.js
```javascript
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
```

#### getUser.js
```javascript
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
```


#### deleteUser.js
```javascript
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
```


#### updateUser.js
```javascript
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
```

#### getCurrentWeather.js
```javascript
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
```


## Getting Started
- First, set up and configure aws and serverless from the below links:
    - [AWS-SDK Node.js](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started.html)
    - [Serverless](https://www.serverless.com/)
    - [Node.js](https://nodejs.org/en/download/)

*** Make sure that when you are setting up AWS Services, the region is set identical to the profile.region information on serverless.yml

### Clone repository
Clone this repository to your local device:
```
git clone https://github.com/john-jaihyek-choi/contact-center-app.git
```

### Install dependencies
Locate to the correct directory where the cloned repository is located

Then install the required dependencies listed in package.json:
```
npm install
```

### Environment setup
Open your serverless.yml file, and on the very top of the file, edit service name to your desired name:
```yaml
service: desired-name

custom:
  settings:
    USERS_TABLE: users
```
On CONTACT-CENTER-APP directory, create a .env file and include the following information (Note: you will need [Open Weather API](https://openweathermap.org/appid) Key for this):
```
OWM_API_KEY=your_API_KEY
```

Once done, go ahead and save all the changes you made

### Deploy lambda functions
on the contact-center-app directory, deploy your lambda via serverless:
```
sls deploy -v
```
Once deployed, you should be seeing something close to this:
```
Serverless: Stack update finished...
Service Information
service: contact-center-app
stage: dev
region: us-west-2
stack: contact-center-app-dev
resources: 43
......
```
Once successfully deployed, check your AWS Lambda and see if all the functions have been created properly

### Exporting Amazon Connect contact flows
- Since the contact flows cannot be installed automatically, you will need to export all the existing contact flows from [my Amazon Connect instance](https://vf-assessment.awsapps.com/connect/login)

- If you click [my Amazon Connect instance](https://vf-assessment.awsapps.com/connect/login), you will be taken to a log-in page

- Input the following log-in credentials (This account will only have viewing abilities and exporting abilities):
    - ID: githubUser
    - Pass: Password123

- once you log in, click the Contact Flows from the Routing tab on the left

- Then find all contact starting with "VF" (total of 18, but can increase as I update)

- Click on one of them and you will see "Export flow(beta)" button on the right top

- Click the button and save in to a desired local directory

- Repeat the above process until you export all of its content

### Exporting Amazon Lex Intents
- Lastly, you need to export Amazon Lex bot to listen for customer's intent on your app

- Locate to your /contact-center-app/lexBots directory and there should be 2 .json files

- Go to your [Amazon Lex account](https://aws.amazon.com/lex/) and log-in

- After you log in, click Bots on the left tab and click the "Action" dropdown button next to create button

- Follow their procedure and import two lexBot files

### Add Amazon Connect Instance
- To start using Amazon Connect, you need to set up an instance

- Please go to [Amazon Connect](https://console.aws.amazon.com/connect/home?p=cnnt&cp=bn&ad=c) and log-in

- Once you log in, you will be taken to Amazon Connect Virtual Contact Center Instances page

- Click Add an Instance button on the left and follow the basic procedure to make your instance

### Set up Routing Profile and Agent Profiles
- You will need to set up routing profile and agent profile manually since they dont have import options

- Refer to [my Amazon Connect profile](https://vf-assessment.awsapps.com/connect/login) to set up a proper routing and agent profiles suitable for this implementation

### Configuring your Amazon Connect for Lambda and Lex
- Now that you are all prepared, we need to configure your Amazon Connect to be able to call Lambda functions and use Lex bots

- From the Amazon Connect Virtual Contact Center Instances page, click on your instance

- Then click on Contact Flows tab on the left

- You will see a section for Amazon Lex and AWS Lambda

- Select the proper region for each of them and add all of the Lambda Functions and Amazon Lex bots you have that is relevant to this instance

### Final tweeks
- Since you've imported all the contact flows from Connect instance, our arn for Lambda invokation are different

- This means you need to make sure that you are adjusting the changes

- Unfortunately, this needs to be done manually:
    - Click into each of the contact flows that has Invoke AWS Lambda function block
    - Once you navigate to the correct block and click it, you will see a dropdown
    - Select the corresponding function that serves its need (ex. createUser, updateUser, etc)

- Once Lambda is properly set, check Lex Bots again too:
    - Click into each of the contact flows that has Get Customer Input which uses Amazon Lex
    - Once you navigate to the correct block and click it, you will see a dropdown
    - Select the corresponding lex bot to use for that block (ex. userRegisterBot and weatherBot)

### Finalize and publish contact flow
- Finally, make sure to publish all the changes on your contact flow and try calling the number associated with your Connect Instance


