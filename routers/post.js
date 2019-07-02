const express = require('express');
const router = express.Router();
const { POST_MODEL } = require('../models/post');
const { USER_MODEL } = require('../models/user');

router.get('/', (req, res) => {
    let { email } = req.session;
        if (!email) res.redirect('/user/login');
    res.render('post')
})

router.post('/new', async (req, res) => {
    try {
        let { email } = req.session;
        if (!email) res.redirect('/user/login');

        let infoUser = await USER_MODEL.findOne({ email });
        if (!infoUser) res.json({ error: true, message: 'USER_NOT_EXIST' });

        let { title, description } = req.body;
        
        let infoPost = new POST_MODEL({ title, description, author: infoUser._id });
        let infoPostAfterInserted = await infoPost.save();

        if (!infoPostAfterInserted) res.json({ error: true, message: 'cannot_save_record' });
        res.redirect('/post/list');
    } catch (error) {
        return res.json({ error: true, message: message });
    }
})

router.get('/list', async (req, res) => {
    try {
        let { email } = req.session;
            if (!email) res.redirect('/user/login');
        let infoUser = await USER_MODEL.findOne({ email });
        if (!infoUser) res.json({ error: true, message: 'USER_NOT_EXIST' });

        let listPost = await POST_MODEL.find({ author: infoUser._id });
        if (!listPost) res.json({ error: true, message: 'CANNOT_GET_LIST' });
        console.log({ listPost });
        res.render('list-post', { listPost });
    } catch (error) {
        return res.json({ error: true, message: error.message });        
    }
});

router.get('/like/:postID', async (req, res) => {
    try {
        const { email } = req.session;
        const { postID } = req.params;
        const infoUser = await USER_MODEL.findOne({ email });

        const postAfterUpdate = await POST_MODEL.findByIdAndUpdate(postID, {
            $addToSet: { liker: infoUser._id }
        }, { new: true });

        res.redirect('/');
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
})
exports.ROUTER_POST = router;