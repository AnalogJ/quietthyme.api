require('dotenv').config();

var db  = require('./server/db');

var book_controller = require("./lib/controllers/book");
var link_controller = require("./lib/controllers/link");
var storage_controller = require("./lib/controllers/storage");
var test_controller = require("./lib/controllers/test");
var user_controller = require("./lib/controllers/user");
module.exports = {

    link_connect: link_controller.connect,
    link_callback: link_controller.callback,


    book_create: book_controller.create,
    book_find: book_controller.find,
    book_destroy: book_controller.destroy,

    storage_status: storage_controller.status,
    storage_upload: storage_controller.upload,
    storage_thumb_upload: storage_controller.thumb_upload,
    storage_link: storage_controller.link,

    test: test_controller.test,

    user_status: user_controller.info
}