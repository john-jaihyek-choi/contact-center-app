Contact Center App
======================

Interactive phone contact center application built utilizing Amazon Connect, DynamoDB, Lambda, Node.js

## Table of content

- [Resources](#resources,-tools,-and-runtime-used)
- [Notes](#notes)
- [Key Features](#key-features)
- [Dial Manual](#dial-manual)
- [Getting Started](#getting-started)
- [Contact Flows](#contact-flows)
- [DynamoDB Tables](#dynamodb-tables)
- [Lambda Functions](#getting-started)


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
- [Google drive notes](https://aws.amazon.com/connect/)

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
