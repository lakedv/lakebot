require("dotenv").config();
const express = require("express");
const Pusher = require("pusher");
const dialogflow = require("@google-cloud/dialogflow");
const cors = require("cors");

const messages = [];
const app = express();
const PORT = process.env.PORT || 3001;
const sessionClient = new dialogflow.SessionsClient();
const projectId = process.env.PROJECT_ID;

app.use(cors());
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
  try {
  const {message} = req.body
  console.log("Mensaje recibido:", message)

  const response = await detectIntent(message)
  const botReply = response.fulfillmentText;

  pusher.trigger("chat", "receiveMessage", {
    message: `GerBot: ${botReply}`,
  })

  res.status(200).send("Mensaje enviado");
} catch(error) {
    console.error("Error en /Chatbot", error.message);
    res.status(500).json({error: "Ocurrió un error procesando el mensaje"})
}
})

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
  throw new Error("Error al comunciarse con DialogFlow")
}
}

app.get("/", (req, res) => {
  res.send("Api is online");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
