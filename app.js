const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require("./db");
const path = require("path");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/:id/notes', async (req, res, next) => {
  try {
    // console.log("req!!!", req.headers.authorization)

    ////have a header

    const token = req.headers.authorization

    const userFromToken = await User.byToken(token)
    console.log("userFrom Token", userFromToken.dataValues.id)
    console.log("ID", req.params.id)
    console.log("PARAMSID", typeof req.params.id)
    console.log("TOKENID", typeof userFromToken.dataValues.id)

    if(userFromToken.dataValues.id === req.params.id){
    const user= await User.findByPk(req.params.id, {
      include: {model: Note}
    });
    res.json(user.notes)}
    {
      console.log("User does not have access")
    }
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
