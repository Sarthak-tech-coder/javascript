const { NlpManager } = require('node-nlp');
const manager = new NlpManager({ languages: ['en'], forceNER: true });
const path = require('path');
manager.load(path.join(__dirname, 'model.nlp'));
const router = require("express").Router()

router.all("/Resp", async (req, res) => {
    console.log(req.body)
    const response = await manager.process('en', req.body.data);
    res.json(response.answers[Math.floor(Math.random() * response.answers.length)])
})
module.exports = router
