"use strict";

const { ApolloServer, makeExecutableSchema } = require("apollo-server-express");
const { SchemaDirectiveVisitor } = require("graphql-tools");

const data = [
  // Returned regardless of auth roles
  {
    productId: 'Product 0',
    cost: 1.23,
    isSensitive: false,
    date: (new Date()).toString(),    
  },
  // Returned iff user has role 'Product 1'
  {
    productId: 'Product 1',
    cost: 3.45,
    isSensitive: true,
    date: (new Date()).toString(),    
  },
  // Returned iff user has role 'Product 2'
  {
    productId: 'Product 2',
    cost: 2.34,
    isSensitive: true,
    date: (new Date()).toString(),    
  }      
];

// const RestrictedProductInformationDirective 

class RestrictedProductInformationDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    const { productIdField, sensitiveFlagField, sensitiveDataField } = this.args;
    const fields = type.getFields();
    const hasAuthLogic = !!(productIdField && sensitiveFlagField && sensitiveDataField);
    const hasAuthFields = !!(
      Object.keys(fields).includes(productIdField) && 
      Object.keys(fields).includes(sensitiveFlagField) &&
      Object.keys(fields).includes(sensitiveDataField)
    )

    if (!hasAuthLogic) {
      throw Error('RestrictedProductInformationDirective: missing required arguments');
    }

    if (!hasAuthFields) {
      throw Error('RestrictedProductInformationDirective: arguments not in object fields');
    }

    const originalSensitiveDataFieldResolver = fields[sensitiveDataField].resolve;

    // eslint-disable-next-line max-params
    fields[sensitiveDataField].resolve = async function(parent, args, context, ...rest) {
      const productField = parent[productIdField];
      const isSensitive = parent[sensitiveFlagField];
      const productRoles = context.me.productRoles;
      const originalResult = originalSensitiveDataFieldResolver(parent, args, context, ...rest);
      if (isSensitive) {
        return productRoles.includes(productField) ? originalResult : null;
      }
      return originalResult;
    }
  }
}


const schemaText = `
  directive @restrictedProductInformation(
    productIdField: String!,
    sensitiveFlagField: String!,
    sensitiveDataField: String!,
  ) on OBJECT

  type SomeValuationQueryResult @restrictedProductInformation(
    productIdField: "productId",
    sensitiveFlagField: "isSensitive",
    sensitiveDataField: "cost",
  ) {
    productId: String!
    cost: Float
    isSensitive: Boolean
    date: String
  }

  type Query {
    someValuationQuery: [SomeValuationQueryResult!]!
  }
`;

const resolvers = {
  Query: {
    someValuationQuery: () => data,
  },
  SomeValuationQueryResult: {
    productId: (parent) => parent.productId,
    cost: (parent) => parent.cost,
    isSensitive: (parent) => parent.isSensitive,
    date: (parent) => parent.date,
  },
};

const schema = makeExecutableSchema({
  typeDefs: [schemaText],
  resolvers,
  schemaDirectives: {
    restrictedProductInformation: RestrictedProductInformationDirective,
  },
});

const createGraphqlServer = ({ logger, playground = true }) => {
  return new ApolloServer({
    schema,
    logger,
    cors: { origin: false },
    playground: Boolean(playground),
    introspection: true,
    context: {
      me: {
        productRoles: ['Product 1'],
      }
    },    
  });
};

module.exports = { schema, createGraphqlServer };
