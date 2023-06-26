const mongoose = require("mongoose");
const Schema = mongoose.Schema
const diarySchema = new Schema({
    User: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    Title: {
        type: "string"
    },
    SubTitle: {
        type: "string"
    },
    isImportant: {
        type: "boolean"
    },
    isProtected: {
        type: "boolean"
    },
    Date: {
        Day: {
            type: "string",
        },
        Date: {
            type: "string",
        },
        Time: {
            type: "string",
        }
    },
    Content: {
        type: "string"
    }
})

module.exports = mongoose.model("Diary", diarySchema)
