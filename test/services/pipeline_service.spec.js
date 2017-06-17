var should = require('should');
var PipelineService = require('../../src/services/pipeline_service')
//this is just simple integration testing
describe.skip('PipelineService', function () {
    describe('#create_with_pipeline()', function () {
        it('Should fail if primary criteria is null', function (done) {
            PipelineService.create_with_pipeline()
                .fail(function (err) {
                    err.should.be.a.Error;
                })
                .then(done, done);
        });

        it('Should fail if primary criteria is missing user_id', function (done) {
            PipelineService.create_with_pipeline({})
                .fail(function (err) {
                    err.should.be.a.Error;
                })
                .then(done, done);
        });
    })
})