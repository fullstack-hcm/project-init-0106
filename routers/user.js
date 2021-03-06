const express = require('express');
const router  = express.Router();
const { hash, compare }   = require('bcrypt');

const { USER_MODEL } = require('../models/user');
const ObjectId = require('mongoose').Types.ObjectId;

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/register', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        console.log({ fullname, email, password })

        let isExist = await USER_MODEL.findOne({ email });
        if (isExist) res.json({ error: true, message: 'USER_DA_TON_TAI' });

        let passHash = await hash(password, 8);
        if (!passHash) res.json({ error: true, message: 'CANNOT_HASH_PASSWORD' });

        let infoUser = new USER_MODEL({ fullname, email, password: passHash });
        let infoInserted = await infoUser.save();

        if (!infoInserted) res.json({ error: true, message: 'CANNOT_INSERT_USER' });
        // res.json({ infoInserted });
        res.redirect('/user/login');
    } catch (error) {
        return res.json({ error: true, message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let isExist = await USER_MODEL.findOne({ email });
        if (!isExist) res.json({ error: true, message: 'EMAIL_NOT_EXISTENCE' });

        console.log({ email, password, isExist })

        let isMatch = await compare(password, isExist.password);
        if (!isMatch) res.json({ error: true, message: 'PW_NOT_MATCHING' });

        /**
         * JWT
         */
        req.session.email = isExist.email;

        res.redirect('/post');
    } catch (error) {
        return res.json({ error: true, message: error.message });
    }
});

router.get('/info', async (req, res) => {
    try {
        const { email } = req.session;
        if (!email) res.json({ error: true, message: 'PERMISSION_DENIED' });

        const infoUser = await USER_MODEL.findOne({ email })
            .populate('guestRequest') // { path: '', select: '', options: {}, match: {} }
            .populate('friends');

        if (!infoUser) res.json({ error: true, message: 'CANNOT_GET_USER' });

        /**
         * get_list
         */
        const listUser = await USER_MODEL.find({
            email: { $ne: email }
        });
        console.log({ listUser, infoUser })

        // res.json({ infoUser });
        res.render('info-user', { infoUser, listUser });
    } catch (error) {
        return res.json({ error: true, message: error.message });
    }
});

router.get('/add-friend/:userRecieveAddFriendID', async (req, res) => {
    try {
        const { email } = req.session;
        const { userRecieveAddFriendID } = req.params;

        if (!ObjectId.isValid(userRecieveAddFriendID))
            res.json({ error: true, message: 'PARAM_INVALID' });
        
        let infoSenderAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $addToSet: { friendsRequest: userRecieveAddFriendID }
        }, { new: true });

        let infoReceiverAfterUpdate = await USER_MODEL.findByIdAndUpdate(userRecieveAddFriendID, {
            $addToSet: { guestRequest: infoSenderAfterUpdate._id }
        }, { new: true });

        if (!infoSenderAfterUpdate || !infoReceiverAfterUpdate) 
            res.json({ error: true, message: 'update_error' });
        
        // res.json({ infoSender: infoSenderAfterUpdate, infoReceiver: infoReceiverAfterUpdate })
        res.redirect('/user/info')
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.get('/remove-request/:userRecieveRemoveRequestID', async (req, res) => {
    try {
        let { email } = req.session;
        let { userRecieveRemoveRequestID } = req.params;

        if (!ObjectId.isValid(userRecieveRemoveRequestID))
            res.json({ error: true, message: 'PARAM_INVALID' });
        
        let infoRemoverAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { friendsRequest: userRecieveRemoveRequestID }
        }, { new: true });

        let infoReceiverRequestAfterUpdate = await USER_MODEL.findByIdAndUpdate(userRecieveRemoveRequestID, {
            $pull: { guestRequest: infoRemoverAfterUpdate._id }
        }, { new: true });

        if (!infoRemoverAfterUpdate || !infoReceiverRequestAfterUpdate )
            return res.json({ error: true, message: 'CANNOT_UPDATE' });

        res.redirect('/user/info')
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.get('/confirm-friend/:userBeConfirmedID', async (req, res) => {
    try {
        const { email } = req.session; // USER CHỦ
        const { userBeConfirmedID } = req.params; // USER BỊ THAO TÁC

        if (!ObjectId.isValid(userBeConfirmedID))
            res.json({ error: true, message: 'PARAM_INVALID' });
        
        /**
         * USER CHỦ
         */
        let infoMainUserAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { guestRequest: userBeConfirmedID },
            $addToSet: { friends: userBeConfirmedID }
        }, { new: true });

        /**
         * USER BE CONFIRM
         */
        let { _id: userMainID } = infoMainUserAfterUpdate;
        let infoUserConfirmedAfterUpdate = await USER_MODEL.findByIdAndUpdate(userBeConfirmedID, {
            $pull: { friendsRequest: userMainID },
            $addToSet: { friends: userMainID }
        }, { new: true });

        if (!infoMainUserAfterUpdate || !infoUserConfirmedAfterUpdate )
            return res.json({ error: true, message: 'CANNOT_UPDATE' });
        res.redirect('/user/info')
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.get('/remove-friend/:userReceiverID', async (req, res) => {
    try {
        const { email } = req.session; // USER CHỦ
        const { userReceiverID } = req.params; // USER BỊ THAO TÁC

        if (!ObjectId.isValid(userReceiverID))
            res.json({ error: true, message: 'PARAM_INVALID' });
        
        let infoUserMainAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { friends: userReceiverID }
        }, { new: true });

        let infoUserReceiveAfterUpdate = await USER_MODEL.findByIdAndUpdate(userReceiverID, {
            $pull: { friends: infoUserMainAfterUpdate._id }
        }, { new: true });
        if (!infoUserMainAfterUpdate || !infoUserReceiveAfterUpdate )
            return res.json({ error: true, message: 'CANNOT_UPDATE' });
        res.redirect('/user/info')
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
})

exports.ROUTER_USER = router;