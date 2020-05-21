"use strict";

const config = require("config");
const express = require("express");
const expressPinoLogger = require("express-pino-logger");
const pino = require("pino");
const cors = require("cors");

const { createGraphqlServer } = require("./graphql");
const loggerConfig = config.util.toObject(config.get("logger"));
const expressConfig = config.util.toObject(config.get("express"));
const playground = config.util.toObject(config.get("showGraphQLPlayground"));
const graphqlPath = "/graphql";
// const cookieConfig = config.util.toObject(config.get('cookie'));

const app = express();
const logger = pino(loggerConfig);

// Error handling middleware
// eslint-disable-next-line max-params,no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500); // eslint-disable-line no-magic-numbers
  res.send("Error");
});

// Logging + Cors middleware
app.use(expressPinoLogger({ logger }));
app.use(cors({ origin: false }));

// GraphQL
const graphqlServer = createGraphqlServer({ logger, playground });
graphqlServer.applyMiddleware({
  app,
  disableHealthCheck: true,
  path: graphqlPath,
});

app.listen(expressConfig);
