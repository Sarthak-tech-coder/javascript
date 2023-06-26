const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs")
const paginate = require('mongoose-paginate-v2');

const UserSchema = new Schema({
    Name: {
        type: 'string',
        required: true,
    },
    Password: {
        type: 'string',
        required: true,
    },
    isConnected: {
        type: 'boolean',
        default: false
    },
    Email: {
        type: 'string',
        required: true,
        unique: true
    },
    Auth: {
        type: "String",
        default: "user",
        enum: ["user", "admin", "superAdmin", "owner"]
    },
    Token: {
        type: "String",
    },
    Friends: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    Diaries: [
        {
            type: Schema.Types.ObjectId,
            ref: "Diary"
        }
    ],
    verified: {
        type: "Boolean",
        default: false
    },
    profilePic: {
        type: "string",
        default: ""
    },
    videoUrl: [
        {
            type: Schema.Types.String
        }
    ],
    JWTToken: [
        {
            type: Schema.Types.String
        }
    ],
    Chats: [
        {
            type: Schema.Types.ObjectId,
            ref: "Chats"
        }
    ],
    Bio: {
        type: Schema.Types.String
    },
    socials: [
        {
            type: Schema.Types.String
        }
    ]
})
UserSchema.statics.findAllUsers = function () {
    return this.find()
}
UserSchema.methods.ReturnAllDATA = function () {
    return (this)
}
UserSchema.methods.Encode = function () {
    var salt = bcrypt.genSaltSync(10);
    this.Password = bcrypt.hashSync(this.Password, salt)
    return (this)
}

UserSchema.plugin(paginate)
module.exports = mongoose.model("User", UserSchema)
