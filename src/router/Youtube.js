const { Router } = require('express')
const router = Router()
require("dotenv").config()
const { google } = require('googleapis');

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YTKEY
})

router.all('/', (req, res) => {
    res.send("200")
})
router.get('/playlist', (req, res) => {
    youtube.playlistItems.list({
        part: "id,snippet",
        playlistId: req.body.id,
        maxResults: 500
    }, (err, items) => {
        if (err) throw err;
        const array = [];
        items.data.items.forEach(item => {
            array.push({
                Name: item.snippet.title,
                channelTitle: item.snippet.videoOwnerChannelTitle,
                position: item.snippet.position,
                id: item.snippet.resourceId.videoId
            })
        })
        res.send(array)
    })
})



module.exports = router
