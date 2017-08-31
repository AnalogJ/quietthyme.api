var should = require('should');
var DBSchemas = require('../../src/common/db_schemas');

describe('DBSchemas', function() {
  describe('createUser', function() {
    it('should correctly populate plan default with `none`', function() {
      var user = DBSchemas.createUser({});
      user.should.eql({
        plan: 'none',
        library_uuid: null,
        stripe_sub_id: null,
        push_notifications: []
      });
      user.plan.should.eql('none');
    });

    it('should remove any invalid keys from data', function() {
      var user = DBSchemas.createUser({
        invalid_key: true,
      }).should.eql({ plan: 'none', library_uuid: null, stripe_sub_id: null, push_notifications: [] });

      should.not.exist(user.invalid_key);
    });

    it('should raise an error if invalid enum is present', function() {
      should.throws(function() {
        var user = DBSchemas.createUser({
          plan: 'hello-world',
        });
      });
    });
  });
});
