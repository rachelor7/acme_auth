const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const saltRounds = 5;

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    let payload = jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(payload.userId);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      // password,
    },
  });

  if (user) {
    //compare hash to password
    const correct = await bcrypt.compare(password, user.password);
    if (correct) {
      let token = await jwt.sign({ userId: user.id }, process.env.JWT);
      return token;
    } else {
      const error = Error("bad credentials");
      error.status = 401;
      throw error;
    }
  } else {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.beforeCreate(async (user, options) => {
  await bcrypt.hash(user.password, saltRounds).then(function (hash) {
    user.password = hash;
  });
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });

  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
