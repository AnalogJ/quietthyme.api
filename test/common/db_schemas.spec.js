var should = require('should');
var DBSchemas = require('../../src/common/db_schemas')

describe('DBSchemas', function () {
    describe('UserSchema', function(){
        it('should correctly populate plan default with `none`', function () {
            var user = DBSchemas.User({})
            user.should.eql({ plan: 'none', library_uuid: '', stripe_sub_id: '' })
            user.plan.should.eql('none')
        })

        it('should remove any invalid keys from data', function () {
            var user = DBSchemas.User({
                "invalid_key": true
            }).should.eql({ plan: 'none', library_uuid: '', stripe_sub_id: '' });

            should.not.exist(user.invalid_key)
        })

        it('should raise an error if invalid enum is present', function () {
            should.throws(function(){
                var user = DBSchemas.User({
                    "plan": 'hello-world'
                })
            })
        })
    })
})