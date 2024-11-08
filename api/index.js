require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dialogflow = require("@google-cloud/dialogflow");

const messages = [];
const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://lakedv.github.io/chatbot",
    methods: ["GET", "POST"],
  },
});

const sessionClient = new dialogflow.SessionsClient();
const projectId = process.env.PROJECT_ID;

io.on("connection", (socket) => {
  console.log("Nuevo usuario conectado:", socket.id);

  io.on("init", () => {
    io.emit("init", messages);
  });

  // Recibir y reenviar mensajes
  socket.on("sendMessage", async (message) => {
    console.log("Mensaje Recibido:", message);

    const response = await detectIntent(message);
    const botReply = response.fulfillmentText;

    io.emit("receiveMessage", `GerBot: ${botReply}`);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

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
