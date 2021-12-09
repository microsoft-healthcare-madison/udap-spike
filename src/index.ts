import config from "./config";
// Trick tsc into running the import above, for side effects
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

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({OK: true})
})

app.use("/endorser", endorser);
app.use("/ehr", ehr);
app.use('/app', healthApp);

// const appTestingJwks = JSON.parse(fs.readFileSync(__dirname + "/../fixtures/app.jwks.json").toString());
// app.get("/app/.well-known/jwks.json", (req, res) => {
//   res.json(appTestingJwks)

// })

const server = app.listen(port, () => {
  console.log(`UDAP Demo is running on port ${port}.`);
});

export default server