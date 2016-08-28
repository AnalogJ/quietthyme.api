module.exports = {
    connect: function (event, context, cb) {
        cb(null,
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },
    callback: function(event, context, cb){
        cb(null,
            { message: 'Go Serverless v1.0! Your function executed successfully!',
                event: event
            }
        );
    },
}