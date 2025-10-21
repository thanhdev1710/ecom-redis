import app from "./app";

app.listen(Number(process.env.CHATBOT_API), "0.0.0.0", () => {
  console.log(
    `Chatbot demo running on http://0.0.0.0:${Number(process.env.CHATBOT_API)}`
  );
});
