var fs = require('fs'),
    JWTokenService = require('../services/JWTokenService.js'),
    Promise = require('bluebird');


module.exports = {
    test: function (event, context, cb) {

        // function getFiles (dir, files_){
        //     files_ = files_ || [];
        //     var files = fs.readdirSync(dir);
        //     for (var i in files){
        //         var name = dir + '/' + files[i];
        //         if (fs.statSync(name).isDirectory()){
        //             getFiles(name, files_);
        //         } else {
        //             files_.push(name);
        //         }
        //     }
        //     return files_;
        // }



        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event,
                token: JWTokenService.issue({id: 1 })
                //env:process.env,
                // paths: getFiles('.')
            }
        );
    },
    test_bluebird: function (event, context, cb){
        console.log('hello~~~');

        Promise
            .delay(3000)
            .then(function(){
                cb(null, {})
            })

        //.timeout(900)
        .catch(function(err){
            cb(err, err.stack)
        });

    }
}