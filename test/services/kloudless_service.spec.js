var should = require('should');
var KloudlessService = require('../../src/services/kloudless_service');
//this is just simple integration testing
describe('KloudlessService', function() {
  describe('#folderCreate() @nock', function() {
    it('Should generate a folder on dropbox', function(done) {
      KloudlessService.folderCreate(
        '231987328',
        'my-test-folder',
        'root',
        'dropbox'
      )
        .then(function(folder_metadata) {
          folder_metadata.should.eql({
            account: 231987328,
            ancestors: [{ name: 'Dropbox', id: 'root' }],
            name: 'my-test-folder',
            parent: { name: 'Dropbox', id: 'root' },
            created: null,
            modified: null,
            can_upload_files: true,
            raw_id: 'id:O87-C4lF9iAAAAAAAAAA0Q',
            can_create_folders: true,
            path: '/my-test-folder',
            type: 'folder',
            id: 'FicKnmotZ4UrkH0cT-bOeZsvf3vjdfR0FvQ1nACB07KU=',
            size: null,
            path_id: 'FYAnOY5mtWYzk9oLdliADbQ==',
          });
        })
        .then(done, done);
    });
  });

  describe.skip('#fileUpload() @nock', function() {
    //TODO: requests made by the "request" library are not being recorded. skipping.
    it('Should correctly upload a file from s3', function(done) {
      KloudlessService.fileUpload(
        '', //credentialID
        '231987328',
        'testfilename.jpg',
        'FYAnOY5mtWYzk9oLdliADbQ==',
        '' //Filepath in S3.
      )
        .then(function(events) {
          events.should.eql({});
        })
        .then(done, done);
    });
  });

  describe.skip('#fileContents() @nock', function() {});

  describe.skip('#fileMove() @nock', function() {});

  describe.skip('#convertId() @nock', function() {});

  describe('#eventsGet() @nock', function() {
    it('Should correctly retrieve events without a cursor', function(done) {
      KloudlessService.eventsGet('231987328')
        .then(function(events) {
          events.should.eql({
            cursor: '689074369',
            count: 1,
            objects: [
              {
                id: '689074369',
                account: 231987328,
                action: '+',
                ip: null,
                modified: null,
                type: 'add',
                user_id: null,
                metadata: {
                  account: 231987328,
                  ancestors: [
                    { name: 'Dropbox', id: 'FbOHF9CrtPQkhUlEkquzMdA==' },
                  ],
                  name: 'my-test-folder',
                  parent: { name: 'Dropbox', id: 'FbOHF9CrtPQkhUlEkquzMdA==' },
                  created: null,
                  modified: null,
                  can_upload_files: true,
                  raw_id: 'id:O87-C4lF9iAAAAAAAAAA0Q',
                  can_create_folders: true,
                  path: '/my-test-folder',
                  type: 'folder',
                  id: 'FicKnmotZ4UrkH0cT-bOeZsvf3vjdfR0FvQ1nACB07KU=',
                  size: null,
                },
              },
            ],
            remaining: 0,
          });
        })
        .then(done, done);
    });
  });

  describe.skip('#linkCreate() @nock', function() {});
});
