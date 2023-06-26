const { Router } = require("express")
const Dotenv = require("dotenv")
const { authenticator } = require('otplib');
var path = require("path"), fs = require("fs");
const QRCode = require('qrcode')
Dotenv.config()
const router = Router()

router.post("/MFAQR", (req, res) => {
    const { Secret, User } = req.body
    const out = authenticator.keyuri(`${User}`, "My diary", Secret)
    QRCode.toDataURL(out, (err, DATA) => {
        if (err) return res.status(500).json({ error: err })
        res.send(DATA)
    })
})
router.post("/verify", (req, res) => {
    const { Token, Secret } = req.body
    console.log(req.body)
    if (!Token) return res.status(500).json({ message: "token not found" })
    const isvalid = authenticator.check(Token, Secret)
    if (isvalid === true) { return res.status(200).json({ message: isvalid }) }
    else { return res.status(400).json({ message: isvalid }) }
})

module.exports = router
