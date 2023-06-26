require("dotenv").config()
const { Router } = require("express")
const userSchema = require("../schemas/User")
const DiarySchema = require("../schemas/Diaries")
const ChatSchema = require("../schemas/Chats")
const { Firestore } = require("../firebase")
const { getDocs, Timestamp, addDoc, updateDoc, collection, setDoc, doc } = require("@firebase/firestore");
const { query, orderBy, limit } = require("firebase/firestore");
const { authenticator } = require('otplib');
const _ = require('lodash')
const { result } = require("lodash")
const jwt = require("jsonwebtoken")
const pusher = require("../app/Pusher")
const authCode = {
    "owner": 0,
    "superAdmin": 1,
    "admin": 2,
    "user": 3
}
var env = process.env.Env || 'development';


function compare(a, b) {
    if (a === b) {
        return 0;
    }
    return a < b ? -1 : 1;
}

const router = Router()
router.get("/", (req, res) => {
    res.json({ "message": "userAPI" })
})
router.post("/register", async (req, res) => {
    const secret = authenticator.generateSecret();
    const { Name, Password, Email } = req.body
    if (!Name || !Password || !Email) return res.status(400).json({ message: "failed" })
    const User = new userSchema({
        Name: Name,
        Password: Password,
        Email: Email.toLowerCase(),
        Token: secret
    })
    User.save().then(() => {
        res.status(201).json({
            success: true,
            message: "Account registered successfully",
            data: User
        })
    }).catch(() => {
        res.status(500).json({
            success: false,
            message: "registration failed successfully, Email Already Exists"
        })
    })
})
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}
function getDay() {
    const Days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",]
    const today = new Date()
    return Days[today.getDay()]
}
router.post("/diary", async (req, res) => {
    const { __id, Title, SubTitle, Content, isImportant, isProtected } = req.body
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const date = `${day}/${month}/${year}`
    const diary = new DiarySchema({
        User: __id,
        Title: Title,
        SubTitle: SubTitle,
        Date: {
            Date: date,
            Day: getDay(),
            Time: formatAMPM(new Date()),
        },
        Content: Content,
        isProtected: isProtected,
        isImportant: isImportant
    })
    userSchema.findById(__id).then(async (user) => {
        if (user === null) return res.status(404).json({ message: "User not found" })
        await diary.save()
        if (user.Diaries === undefined) {
            result.Diaries = []
        }
        user.Diaries.push(diary._id)
        await user.save()
        await user.populate("Diaries").then((doc) => {
            res.status(200).json({
                data: doc
            })
        })
    })
})
router.post("/form_Pgroup", async (req, res) => {
    const Users = req.body.Users
    if (!Users) return res.status(500).json({ message: "failed" })
    const Combained = await makeid(15);
    const colRef = collection(Firestore, Combained)
    addDoc(colRef, {
        Timestamp: Timestamp.now(),
        User: "Server",
        message: "Chat Started",
        Uid: "Server"
    })
    console.log(Users[0], Users[1])
    const Chat = new ChatSchema({
        Users: [Users[0], Users[1]],
        FirestoreID: Combained,
        type: "pgroup"
    })
    for (var i of Users) {
        userSchema.findById(i).then((docs) => {
            if (docs.Chats === undefined) docs.Chats = []
            console.log(docs)
            docs.Chats.push(Chat._id)
            docs.save()
        })
    }
    Chat.save()
    res.json(Chat)
})
router.post("/form_Ggroup", async (req, res) => {
    const { Users, data, adminOnly, adminUsers } = req.body
    if (!Users) return res.status(500).json({ message: "failed" })
    const Combained = await makeid(15);
    const colRef = collection(Firestore, Combained)
    addDoc(colRef, {
        Timestamp: Timestamp.now(),
        User: "Server",
        message: "Chat Started",
        Uid: "Server"
    })
    console.log(Users[0], Users[1])
    const Chat = new ChatSchema({
        Users: Users,
        FirestoreID: Combained,
        adminOnly: adminOnly,
        adminUsers: adminUsers,
        type: "Ggroup",
        data: {
            icon: data.icon,
            Name: data.Name,
            subtitle: data.subtitle
        }
    })
    for (var i of Users) {
        userSchema.findById(i).then((docs) => {
            if (docs.Chats === undefined) docs.Chats = []
            console.log(docs)
            docs.Chats.push(Chat._id)
            docs.save()
        })
    }
    Chat.save()
    res.json(Chat)
})
router.get("/chatroomid", (req, res) => {
    const Users = req.body.Users
    if (!Users) return res.status(500).json({ message: "failed" })
    ChatSchema.findOne({ Users: [Users[0], Users[1]] }).then((result) => {
        res.json({
            data: result
        })
    })
})

router.post("/getuser", (req, res) => {
    const { __id } = req.body
    if (!__id) return res.status(404).json({ status: "failed successfully" })
    userSchema.findById(__id).then((user) => {
        user.populate("Diaries").then((user) => {
            user.populate("Chats").then((userObj) => {
                for (var i in userObj.Chats) {
                    const x = userObj.Chats[i].Users.indexOf(userObj._id)
                    const deletedV = userObj.Chats[i].Users.splice(x, 1)
                }
                userObj.populate("Chats.Users", "_id Name profilePic").then((userObj) => {
                    userObj.populate("Friends", "_id Name profilePic").then((userObj) => {
                        return res.status(200).json(userObj)
                    })
                })
            })

        })
    })
})
router.get("/Alldiary", async (req, res) => {
    const { __id } = req.body
    if (!__id) return res.status(400).json({ status: "failed" })
    userSchema.findById(__id).then((user) => {
        user.populate("Diaries").then((result) => {
            res.status(200).json(result)
        })
    })
})
router.post('/login', async (req, res) => {
    const { Email, Password } = req.body
    if (!Email || !Password) return res.status(400).json({ status: "failed" })
    userSchema.findOne({ Email: Email.toLowerCase() }).then((user) => {
        if (user === null) return res.status(404).json({ status: "user not found" })
        if (user.Password === Password) {
            user.populate("Diaries").then((user) => {
                const JwtToken = jwt.sign({
                    Email: user.Email
                }, process.env.JWTKEY, {
                    expiresIn: "10d"
                })
                user.JWTToken = [...user.JWTToken, JwtToken]
                user.save()
                user.populate("Chats").then((userObj) => {
                    for (var i in userObj.Chats) {
                        const x = userObj.Chats[i].Users.indexOf(userObj._id)
                        const deletedV = userObj.Chats[i].Users.splice(x, 1)
                    }
                    userObj.populate("Chats.Users", "_id Name profilePic").then((userObj) => {
                        userObj.populate("Friends", "_id Name profilePic").then((userObj) => {
                            return res.status(200).json({ status: "success", data: userObj, JwtToken: JwtToken })
                        })
                    })
                })
            })
        } else {
            return res.status(401).json({ status: "failed" })
        }
    })
})
router.delete("/diary", async (req, res) => {
    const { _id } = req.body
    if (!_id) return res.status(400).json({ status: "failed" })
    DiarySchema.findByIdAndDelete(_id).then((result) => {
        userSchema.findById(result.User).then((result) => {
            // @ts-ignore
            try {
                result.Diaries = result.Diaries.filter(d => d._id != _id)
                result.save()
                result.populate("Diaries").then((result) => {
                    res.status(200).json({ status: "success", data: result })
                })
            }
            catch (e) {
                res.status(200).json({ status: "success", data: "user not found" })
            }
        })
    })
})
router.post("/connect", (req, res) => {
    const { _id } = req.body
    if (!_id) return res.status(400).json({ status: "failed" })
    userSchema.findById(_id).then((result) => {
        result.isConnected = true
        result.save()
        res.json({ status: "success", data: result })
    })
})
router.post("/UpdateDiary", (req, res) => {
    const { id, diary } = req.body
    if (!id || !diary) return res.status(400).json({ status: "failed" })
    DiarySchema.findByIdAndUpdate(id, { $set: { Title: diary.Title, SubTitle: diary.SubTitle, Content: diary.Content } }).then((result) => {
        userSchema.findById(result.User).then((result) => {
            result.populate("Diaries").then((result) => {
                res.status(200).send({
                    data: result
                })
            })
        })
    })
})

router.get("/allUsers", async (req, res) => {
    const data = await userSchema.find({})
    if (!data) {
        return res.status(404).json({ message: "error" })
    } else {
        var sorted = data.sort(function (a, b) {
            var index_result = compare(authCode[a.Auth],
                authCode[b.Auth]);
            if (index_result === 0) {
                return compare(a._id, b._id);
            }
            return index_result;
        });
        res.send(sorted)
    }
})
router.get("/alldiaries", async (req, res) => {
    const data = await DiarySchema.find({})
    if (!data) {
        return res.status(404).json({ message: "error" })
    } else {
        const Array = [];
        for (const key in data) {
            data[key].populate("User", "_id Auth Name").then((value) => {
                Array.push(value)
                console.log(Array.length === data.length, Array.length, data.length)
                if (Array.length === data.length) {
                    res.send(Array)
                }
            })
        }
    }
})
router.get("/allChats", async (req, res) => {
    const data = await ChatSchema.find({})
    if (!data) {
        return res.status(404).json({ message: "error" })
    } else {
        res.send(data)
    }
})
router.put("/userVideo", (req, res) => {
    const { imgUrl, videoUrl, _id } = req.body
    userSchema.findById(_id).then((user) => {
        if (imgUrl !== undefined) {
            user.profilePic = imgUrl
        }
        if (videoUrl !== undefined) {
            {
                user.videoUrl = videoUrl
            }
            user.save()
        }
    })
    console.log(_id)

    pusher.trigger("User", "update", {
        data: {
            id: _id
        }
    })

})
router.post("/removeChatUser", (req, res) => {
    const { UserId, ChatId } = req.body
    console.log(UserId, ChatId)
    if (UserId === undefined || ChatId === undefined) return res.status(401)
    ChatSchema.findById(ChatId).then((responce) => {
        if (responce.adminUsers !== undefined) {
            var index = responce.adminUsers.indexOf(UserId)
            if (index !== -1) {
                responce.adminUsers.splice(index, 1)
            }
            console.log(responce.adminUsers)
        }
        var Index = responce.Users.indexOf(UserId)
        if (Index !== -1) {
            responce.Users.splice(Index, 1)
            userSchema.findById(UserId).then((result) => {
                const index = result.Chats.indexOf(ChatId)
                result.Chats.splice(index, 1)
                result.save()
                responce.save()
                console.log("saving result")

                res.json({ status: '200', message: "success" })
                pusher.trigger("Chat", "update", {
                    data: {
                        id: ChatId
                    }
                })
                pusher.trigger("User", "update", {
                    data: {
                        id: UserId
                    }
                })
            })
        } else {
            console.log("nothing")
        }
    })
})
router.delete("/user", async (req, res) => {
    const _id = req.body._id
    const user = await userSchema.findOneAndDelete(_id)
    res.send("success")
})
router.put("/updateUserData", async (req, res) => {
    const { id, Name, Password, Email, Token, verified, isConnected, Auth, profilePic, videoUrl, bio } = req.body
    const update = {
        Name: Name,
        Password: Password,
        Email: Email,
        Token: Token,
        isConnected: isConnected,
        verified: verified,
        profilePic: profilePic,
        Auth: Auth,
        videoUrl: videoUrl,
        Bio: bio
    };
    const result = await userSchema.findByIdAndUpdate(id, update, { new: true })
    res.status(202).json(result);
    console.log(id)
    pusher.trigger("User", "update", {
        data: {
            id: id
        }
    })
})
router.post("/addFriend", async (req, res) => {
    const { _UserID, _FriendID } = req.body
    const updated = await userSchema.findById(_UserID)
    updated.Friends.push(_FriendID)
    updated.save()
    await updated.populate("Friends").then(async doc => {
        await doc.populate("Diaries").then(result => {
            res.json(result)
        })
    })
})
router.post("/JWT_VERIFY", async (req, res) => {
    const { Token } = req.body
    if (!Token) return res.status(403).json({ "message": "Token is required" })
    jwt.verify(Token, process.env.JWTKEY, async (err, verify) => {
        if (err) return res.status(400).json({ "message": "invalid token" })
        const user = await userSchema.findOne({ Email: verify.Email })
        if (user.JWTToken.includes(Token)) {
            user.populate("Diaries").then((user) => {
                user.populate("Chats").then((userObj) => {
                    for (var i in userObj.Chats) {
                        const x = userObj.Chats[i].Users.indexOf(userObj._id)
                        const deletedV = userObj.Chats[i].Users.splice(x, 1)
                    }
                    userObj.populate("Chats.Users", "_id Name profilePic").then((userObj) => {
                        userObj.populate("Friends", "_id Name profilePic").then((userObj) => {
                            return res.status(200).json({ "message": "Successfully authenticated", data: userObj })
                        })
                    })
                })
            })
        } else {
            res.status(400).json({ "message": "Task failed successfully" })
        }
    })
})
router.all("/ClientUpdate", function (req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(JSON.stringify({ message: "connection" }))
    userSchema.watch().on("change", (data) => {
        if (data.operationType === "update" && data.updateDescription.updatedFields["JWTToken"] === undefined) {
            res.write(`${JSON.stringify({ id: data.documentKey._id })}\n\n`);
        }
    })
    res.on('close', () => {
        console.log('close')
        res.end();
    });

})


module.exports = router
