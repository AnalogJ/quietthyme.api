var should = require('should');
var DBSchemas = require('../../src/common/db_schemas')

describe('DBSchemas', function () {
    describe('UserSchema', function(){
        it('should correctly populate plan default with `none`', function () {
            var user = {}
            DBSchemas.User(user).should.eql(true)
            user.plan.should.eql('none')
        })

        it('should remove any invalid keys from data', function () {
            var user = {
                "invalid_key": true
            }
            DBSchemas.User(user).should.eql(true)
            should.not.exist(user.invalid_key)
        })

        it('should raise an error if invalid enum is present', function () {
            var user = {
                "plan": 'hello-world'
            }
            DBSchemas.User(user).should.eql(false)
        })
    })
})