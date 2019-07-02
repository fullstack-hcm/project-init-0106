const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const USER_SCHEMA = new Schema({
    fullname: { type: String, required: true },
    age: String,
    /**
     * EMAIL TRONG BAT CU THOI DIEM NAO => KO TRUNG
     */
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    /**
    * USER ĐÃ KẾT BẠN
    */
    friends: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
   /**
    * USER Đã gửi lời mời kết bạn cho mình
    */
    guestRequest: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
   /**
    * USER MÌNH ĐÃ gửi mời kết bạn
    */
    friendsRequest: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
   /**
    * -1. chưa xác mình
    *  1. đang hoạt động
    *  0. bị khoá
    */
   status: { type: Number, default: -1 }
});

const User       = mongoose.model('user', USER_SCHEMA);
exports.USER_MODEL = User;