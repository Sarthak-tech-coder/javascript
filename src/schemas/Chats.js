const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    Users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    FirestoreID: {
        required: true,
        unique: true,
        type: mongoose.Schema.Types.String
    },
    type: {
        type: mongoose.Schema.Types.String,
        default: "pgroup"
    },
    data: {
        icon: {
            type: mongoose.Schema.Types.String,
        },
        Name: {
            type: mongoose.Schema.Types.String
        },
        subtitle: { type: mongoose.Schema.Types.String }
    },
    adminOnly: { type: mongoose.Schema.Types.Boolean, default: false },
    adminUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    verified: { type: mongoose.Schema.Types.Boolean, default: false },
})
module.exports = mongoose.model('Chats', chatSchema)
