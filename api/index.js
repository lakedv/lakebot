require("dotenv").config();
const express = require("express");
const http = require("http");
const Pusher = require("pusher");
const dialogflow = require("@google-cloud/dialogflow");
const cors = require("cors");

const messages = [];
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const sessionClient = new dialogflow.SessionsClient();
const projectId = process.env.PROJECT_ID;

const allowedOrigins = [
  "https://lakedv.github.io/",
  "http://localhost:3000"
]

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

//Conexion Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
})

app.post("/Chatbot", async (req, res) => {
  const {message} = req.body
  console.log("Mensaje recibido:", message)

  const response = await detectIntent(message)
  const botReply = response.fulfillmentText;

  pusher.trigger("chat", "receiveMessage", {
    message: `GerBot: ${botReply}`,
  })

  res.status(200).send("Mensaje enviado");
})

async function detectIntent(message) {
  const sessionId = Math.random().toString(36).substring(7);
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: "es",
      },
    },
  };
  const responses = await sessionClient.detectIntent(request);
  return responses[0].queryResult;
}

app.get("/", (req, res) => {
  res.send("Api is online");
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
