require("dotenv").config();
const express = require("express");
const Pusher = require("pusher");
const dialogflow = require("@google-cloud/dialogflow");
const cors = require("cors");

const messages = [];
const app = express();
const PORT = process.env.PORT || 3001;
const config = {
  credentials:{
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL
  } 
}
const sessionClient = new dialogflow.SessionsClient(config);
const projectId = process.env.PROJECT_ID;
const allowedOrigins = [
  "http://localhost:3000",
  "https://lakebot-api.vercel.app",
  "https://lakedv.github.io"

]

app.options('*', cors())

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

//Conexion Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

app.post("/Chatbot", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Mensaje recibido:", message);

    const response = await detectIntent(message);
    const botReply = response.fulfillmentText;

    pusher.trigger("chat", "receiveMessage", {
      message: `GerBot: ${botReply}`,
    });

    res.status(200).send("Mensaje enviado");
  } catch (error) {
    console.error("Error en /Chatbot", error.message);
    res.status(500).json({ error: "Ocurrió un error procesando el mensaje" });
  }
});

async function detectIntent(message) {
  try {
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
  } catch (error) {
    console.error("Error en detectIntent", error.message);
    throw new Error("Error al comunciarse con DialogFlow");
  }
}

app.get("/", (req, res) => {
  res.send("Api is online");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});