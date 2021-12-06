import express from 'express';
import endorser from "./endorser";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({OK: true})
})

app.use("/endorser", endorser);

app.listen(port, () => {
  console.log(`UDAP Demo is running on port ${port}.`);
});