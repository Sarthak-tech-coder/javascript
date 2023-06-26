const Pusher = require('pusher')

const pusher = new Pusher({
    appId: "1594863",
    key: "4a5cb7ac6221481b24c4",
    secret: "a33c89a5f61d64fb1844",
    cluster: "ap2",
    useTLS: true
});
module.exports = pusher 
