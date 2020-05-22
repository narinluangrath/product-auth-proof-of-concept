"use strict";

const { defaultFieldResolver } = require("graphql");
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

class Product {
	constructor(productData) {
		Object.assign(this, productData);
	}

	isRestricted() {
		return this.isSensitive
	}

	roleName() {
		return this.productId
	}
}

class SensitiveDataDirective extends SchemaDirectiveVisitor {
	wrapSensitiveField(field) {
			if (field._sensitiveWrapped) {
				return
			}
			const { previousResolver = defaultFieldResolver } = field;
			// eslint-disable-next-line max-params
			field.resolve = async function(parent, args, context, ...rest) {
				if (parent.isRestricted()) {
					const requiredRole = parent.roleName()
					const userRoles = context.me.roles;
					if (!userRoles.includes(requiredRole)) {
						return null;
					}
				}
				return previousResolver(parent, args, context, ...rest);
			}
	}

	visitObject(type) {
		const fields = type.getFields();
		Object.keys(fields).forEach((fieldName) => {
			this.wrapSensitiveField(fields[fieldName]);
		})
	}

	visitFieldDefinition(field) {
		this.wrapSensitiveField(field);
  }
}


const schemaText = `
	directive @sensitive on OBJECT | FIELD_DEFINITION

  type SomeValuationQueryResult {
    productId: String!
    cost: Float @sensitive
    isSensitive: Boolean
    date: String
  }

	type AnotherQueryResult @sensitive {
		productId: String!
		cost: Float
		date: String
	}

  type Query {
    someValuationQuery: [SomeValuationQueryResult!]!
		anotherQuery: [AnotherQueryResult]
  }
`;

const resolvers = {
  Query: {
    someValuationQuery: () => data.map((d) => { return new Product(d) }),
  }
};

const schema = makeExecutableSchema({
  typeDefs: [schemaText],
  resolvers,
  schemaDirectives: {
		sensitive: SensitiveDataDirective
	}
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
        roles: ['Product 1'],
      }
    },    
  });
};

module.exports = { schema, createGraphqlServer };
