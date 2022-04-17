import { writeFile } from "node:fs/promises";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ModelManager } from "@glazed/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays";

// network node we're gonna interract with (test network)
const endpoint = "https://ceramic-clay.3boxlabs.com";

// The key must be provided as an environment variable
const key = fromString(process.env.DID_KEY, "base16");

// Create and authenticate the DID
const did = new DID({
  provider: new Ed25519Provider(key),
  resolver: getResolver(),
});
await did.authenticate();

// Connect to the local Ceramic node
const ceramic = new CeramicClient(endpoint);
ceramic.did = did;

// Create a manager for the model
const manager = new ModelManager(ceramic);

// SimpleNote schema
const noteSchemaID = await manager.createSchema("SimpleNote", {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SimpleNote",
  type: "object",
  properties: {
    text: {
      type: "string",
      title: "text",
      maxLength: 4000,
    },
  },
});

// Create the definition using the created schema ID
await manager.createDefinition("myNote", {
  name: "Farouk's note",
  description: "My first note",
  schema: manager.getSchemaURL(noteSchemaID),
});

// Create a tile using the created schema ID
// Tile is similar to a definition but the schema is provided as metadata instead
await manager.createTile(
  "exampleNote",
  { text: "A simple note" },
  { schema: manager.getSchemaURL(noteSchemaID) }
);

// Publish model to Ceramic node
const model = await manager.toPublished();

// Write published model to JSON file
await writeFile("./model.json", JSON.stringify(model));

