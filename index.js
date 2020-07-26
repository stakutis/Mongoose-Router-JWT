const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const csv = require("csv-parser");
const fs = require("fs");

const db = require("./db");

const app = express();
app.use(express.json());

app.post("/login", (req, res) => {
  console.log("Login:" + req.body);
  let token = jwt.sign(req.body.username, process.env.SECRETKEY);
  console.log("Token:" + token);
  res.json({ token });
});

mongoose.connect(
  "mongodb://localhost:27017/hsc",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (data) => {
    console.log("Connected, data:", data);
  }
);

function authenticateToken(req, res, next) {
  console.log("authenticateToken headers:", req.headers);
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  console.log("token:" + token);
  const sign = jwt.verify(token, process.env.SECRETKEY);
  if (!sign) res.sendStatus(403);
  next();
}

const patientSchema = new mongoose.Schema({
  "Program Identifier": String,
  "Data Source": String,
  "Card Number": Number,
  "Member ID": Number,
  "First Name": String,
  "Last Name": String,
  "Date of Birth": String,
  "Address 1": String,
  "Address 2": String,
  City: String,
  State: String,
  "Zip code": Number,
  "Telephone number": String,
  "Email Address": String,
  CONSENT: String,
  "Mobile Phone": String,
});

const emailSchema = new mongoose.Schema({
  "Member ID": String,
  "Email Address": String,
  When: Date,
  Message: String,
});

const patientsModel = mongoose.model(
  "patientsCollection",
  patientSchema,
  "patientsCollection"
);

const emailModel = mongoose.model(
  "emailCollection",
  emailSchema,
  "emailCollection"
);

async function processData(filename) {
  let count = 0;
  let emailCount = 0;
  try {
    await mongoose.connection.collection("patientsCollection").drop();
  } catch (err) {
    console.log("err dropping patientsCollection:", err);
  }

  try {
    await mongoose.connection.collection("emailCollection").drop();
  } catch (err) {
    console.log("err dropping emailCollection:", err);
  }
  fs.createReadStream(filename)
    .pipe(csv({ separator: "|" }))
    .on("data", async (data) => {
      let patient = new patientsModel(data);
      count++;
      // NOTE: Some dates are illegal, like the last one which is an illegal year
      // So we'll store it as a string, not a date: hcs["Date of Birth"] = new Date(data["Date of birth"]);
      await patient.save();

      if (patient.CONSENT == "Y") {
        emailCount++;
        let emailPatient = data["Member ID"];
        console.log("Start emailPatient:", emailPatient);
        let date = new Date();
        date.setDate(date.getDate() + 1);
        let baseEmail = {
          "Member ID": data["Member ID"],
          "Email Address": data["Email Address"],
          When: date,
          Message: "First email message",
        };
        let email = new emailModel({ ...baseEmail });
        await email.save();
        email = new emailModel({ ...baseEmail });
        email.When.setDate(baseEmail.When.getDate() + 1);
        email.Message = "Second email message";
        await email.save();
        email = new emailModel({ ...baseEmail });
        email.When.setDate(baseEmail.When.getDate() + 1);
        email.Message = "Third email message";
        await email.save();
        email = new emailModel({ ...baseEmail });
        email.When.setDate(baseEmail.When.getDate() + 1);
        email.Message = "Fourth email message";
        await email.save();
        console.log("FINISHED emails for patient:", emailPatient);
      }
    })
    .on("end", () => {
      console.log("END; Saved:", count, "EmailCount:", emailCount);
    });
}

processData("data.csv");

app.use("/db", authenticateToken, db);
console.log("Env:" + process.env.SECRETKEY);
app.listen(3000, () => console.log("listening"));
