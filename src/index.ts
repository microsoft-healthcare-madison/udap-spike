// See https://github.com/motdotla/dotenv/issues/133#issuecomment-255298822
import config from "./config";
// Trick tsc into running the unused import above, for side effects
const forceDotenvLoadForSideEffects = config;

import express from 'express';
import endorser from "./endorser";
import ehr from "./ehr";
import healthApp from "./app";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// default is allow-any
app.use(cors());
app.set('json spaces', 2)


app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({OK: true})
})

app.use("/endorser", endorser);
app.use("/ehr", ehr);
app.use('/app', healthApp);

const server = app.listen(port, () => {
  console.log(`UDAP Demo is running on port ${port}.`);
});

process.on('uncaughtException', function(err){
  console.error(err);
  console.log("Swallowed");
})

export default server