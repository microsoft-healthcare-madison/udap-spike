import express from 'express';
import endorser from "./endorser";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.json({OK: true})
})

app.use("/endorser", endorser);

app.listen(port, () => {
  console.log(`UDAP Demo is running on port ${port}.`);
});