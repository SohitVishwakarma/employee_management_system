const express = require('express');
const { ApolloServer, UserInputError } = require('apollo-server-express');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const app = express();

app.use(express.static('public'));

let database,collection;
(async () => {
    
    const client = new MongoClient(" mongodb+srv://sohitvishwakarma:1234@cluster0.x61thnu.mongodb.net/");
    await client.connect();
    database = client.db('assignmentDB');
    collection = database.collection('employeeList');
})();

app.listen(2500, function () {
    console.log('App started on port 2500...');
});

app.use("/", express.static('public'));

const GraphQLDate = new GraphQLScalarType({
    name: 'GraphQLDate',
    description: 'A Date() type in GraphQL as a scalar',
    serialize(value) {
        return value.toISOString();
    },
    parseValue(value) {
        const dateValue = new Date(value);
        return isNaN(dateValue) ? undefined : dateValue;
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            const value = new Date(ast.value);
            return isNaN(value) ? undefined : value;
        }
    },
});

const validateEmployee = () => {
    let errors = [];
    if (errors.length > 0) 
    {
      throw new UserInputError('Invalid input(s)', { errors });
    }
}

// asyc function for adding new employee to mongodb. It will be called when mutaion query will run from client side...
async function addEmployee(_, { employee }) {
    validateEmployee({employee});
    
    //id for new data, i.e. getting all collection number and adding 1 to it...
    employee.id = await collection.countDocuments() + 1;

    //_id for storing in mongodb...
    employee._id = new ObjectId();

    //default status 1 i.e. working...
    employee.status = 1;

    //inserting data...
    await collection.insertOne(employee);
    
    return employee;
}

//redolvers for graphql api...
const resolvers = {
    Query: {
        employeeList: getEmployees,
    },
    Mutation: {
        addEmployee,
    },
    GraphQLDate,
};

//function for getting data from graphql. It will be called when graphql query will be there from client side... 
async function getEmployees() {
    const employee = await collection.find({}).toArray();
    return employee;
}

const server = new ApolloServer({
    typeDefs : fs.readFileSync('./server/schema.graphql', 'utf-8'),
    resolvers,
    formatError: error => {
        console.error(error);
        return error;
    },
});

server.applyMiddleware({ app, path: '/graphql' });