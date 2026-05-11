const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

let pinecone;
try {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "dummy-key-to-prevent-crash",
  });
} catch (error) {
  console.log("Pinecone client not initialized properly:", error.message);
}

const getPineconeIndex = () => {
    return pinecone ? pinecone.index(process.env.PINECONE_INDEX_NAME || "panda-shop") : null;
};

module.exports = { pinecone, getPineconeIndex };
