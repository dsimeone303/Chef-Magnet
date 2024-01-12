const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const axios = require("axios"); //used for making HTTP request
const cheerio = require("cheerio"); // parsing HTML
const mysql = require("mysql2");

const port = 3000;
const app = express();

//database shit
/*
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "chefmagnet",
  database: "chefMagnetDB"
});

db.connect(err => {
  if (err) {
    throw err;
  }
  console.log("connected to Mysql FUCK YEAH");
});

//this stuff goes through sqlquery
db.query(`
      CREATE TABLE IF NOT EXISTS scraped_recipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      url VARCHAR(600),
      photo_url varchar(600),
      title varchar(255),
      cousine varchar (40),
      meal_type varchar(40),
      main_url varchar (255)
    );
    `);
*/
//switch public to static for express:
app.use("/static", express.static("public"));

//what is bodyparser - allows express to parse form data
app.use(bodyParser.urlencoded({ extended: false }));

const cons = require("consolidate");
app.engine("html", cons.nunjucks);

const mainpage = require("./routes/main");
app.use("/", mainpage);

const theAPI = require("./routes/api");
app.use("/api", theAPI);

const maricruz = require("./routes/websites/mexican/maricruzavalos");
app.use("/websites/mexican/maricruzavalos", maricruz);

//handle form submission:
app.get("/getit", (req, res) => {});
app.post("/submit", (req, res) => {
  const formData = req.body;
  console.log(formData);
});

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }
  res.status(e500);
  res.render("error", { error: err });
});

app.listen(port, () => {
  console.log("app is running local 3000");
});
