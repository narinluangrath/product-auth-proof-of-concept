"use strict";

module.exports = {
  logger: { level: "info" },
  express: { port: 4000, host: "0.0.0.0" },
  azureAd: {
    loggingLevel: "info",
    identityMetadata: null,
    audience: null,
    clientID: null,
  },
  cookie: { name: "azuread", secret: "" },
  showGraphQLPlayground: false,
};
