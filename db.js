const router = require("express").Router();
const mongoose = require("mongoose");

const mySchema = new mongoose.Schema({
  name: {
    type: String,
    reqired: true,
  },
  address: {
    type: String,
  },
});

const userModel = mongoose.model("testCollection", mySchema, "testCollection");

router.get("/", async (req, res) => {
  /*
  console.log("Putting...");
  const user = new userModel({
    name: "joejoe2222",
    address: "homeless",
  });
  const result = await user.save();
  console.log("result:", result);
  res.send("result:" + result);

  /*
  user.findOne((err, result) => {
    console.log("Got err:", err, " Result:", result);
    res.send(result);
  });
  */
  const data = await userModel.find();
  console.log("got data:", data);
  res.send("hi there:" + data);
});

module.exports = router;
