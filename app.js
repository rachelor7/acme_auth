const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require("./db");
const path = require("path");

const requireToken = async (req, res, next) => {
  try {
    // req.headers is an extra arg passed in from axios call
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/:id/notes", requireToken, async (req, res, next) => {
  try {
    // req.user is from middleware requireToken function
    const tokenUserId = req.user.id.toString();

    if (tokenUserId === req.params.id) {
      const user = await User.findByPk(req.params.id, {
        include: { model: Note },
      });
      res.json(user.notes);
    } else {
      console.log("User does not have access");
    }
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth", requireToken, async (req, res, next) => {
  try {
    // res.send(await User.byToken(req.headers.authorization));
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
