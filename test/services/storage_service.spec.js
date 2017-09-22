var should = require('should');
var StorageService = require('../../src/services/storage_service');

//this is just simple integration testing
describe('StorageService', function() {
  describe('#book_filename()', function() {
    it('Should generate a filename from title and author', function() {
      StorageService.book_filename({
        title: 'book title',
        authors: ['book author1'],
      }).should.eql('book author1 - book title');
    });

    it('Should generate a filename from title, series data and author', function() {
      StorageService.book_filename({
        title: 'book title',
        authors: ['book author1'],
        series_name: 'book series name',
        series_number: 5,
      }).should.eql('book author1 - book series name - 5 - book title');
    });

    it('Should correctly clean special characters from string. ', function() {
      StorageService.book_filename({
        title: "book titlewith'quote",
        authors: ['book author1'],
        series_name: 'book series name',
        series_number: 5,
      }).should.eql(
        'book author1 - book series name - 5 - book titlewithquote'
      );
    });
  });

  describe.skip('#move_to_perm_storage()', function() {});

  describe.skip('#download_book_tmp()', function() {});

  describe.skip('#get_user_storage()', function() {});

  describe.skip('#get_download_link()', function() {});

  describe('#upload_file_from_path()', function() {
    it('Should fail if invalid local path', function(done) {
      StorageService.upload_file_from_path(
        './test/fixtures/doesnotexist.pdf',
        'test-bucket',
        'test-key'
      )
        .fail(function(err) {
          err.should.be.an.Error;
        })
        .then(done, done);
    });

    it('Should upload book to s3', function(done) {
      StorageService.upload_file_from_path(
        './test/fixtures/fatherg-oscard.opf',
        'test-bucket',
        'test-key'
      )
        .then(function(data) {
          data.should.eql({ bucket: 'test-bucket', key: 'test-key' });
        })
        .then(done, done);
    });
  });

  describe('#create_content_identifier()', function() {
    it('Should create image content_identifier', function() {
      StorageService.create_content_identifier(
        'image',
        'user-id',
        'test-image-filename',
        '.jpg'
      ).should.eql(
        '7de3a1cfcc0432025156e72ee7b4b688/images/test-image-filename.jpg'
      );
    });

    it('Should create cover content_identifier', function() {
      StorageService.create_content_identifier(
        'cover',
        'user-id',
        'test-cover-filename',
        '.jpg'
      ).should.eql(
        '7de3a1cfcc0432025156e72ee7b4b688/covers/test-cover-filename.jpg'
      );
    });

    it('Should create library content_identifier', function() {
      StorageService.create_content_identifier(
        'book',
        'user-id',
        'test-book-filename',
        '.epub'
      ).should.eql(
        '7de3a1cfcc0432025156e72ee7b4b688/library/test-book-filename.epub'
      );
    });
  });

  describe('#create_upload_identifier()', function() {
    it('Should create new book upload_identifier', function() {
      StorageService.create_upload_identifier(
        'user-id',
        'cred-id',
        null,
        'test-book-filename',
        '.epub'
      ).should.eql(
        '7de3a1cfcc0432025156e72ee7b4b688/user-id/cred-id/NEW/test-book-filename.epub'
      );
    });

    it('Should create existing book upload_identifier', function() {
      StorageService.create_upload_identifier(
        'user-id',
        'cred-id',
        'book-id',
        'test-book-filename',
        '.epub'
      ).should.eql(
        '7de3a1cfcc0432025156e72ee7b4b688/user-id/cred-id/book-id/test-book-filename.epub'
      );
    });
  });

  describe('#delete_book_storage()', function() {
    it('Should succeed if deleting quietthyme file path that doesnt exist', function(done) {
      StorageService.delete_book_storage(
        'quietthyme',
        'bucketname/fixtures/doesnotexist.pdf',
        'quietthyme'
      )
        .then(function(err) {
          data.should.eql({ });
        })
        .then(done, done);
    });

    it('Should correctly delete quietthyme storage', function(done) {
      StorageService.upload_file_from_path(
        './test/fixtures/fatherg-oscard.opf',
        'test-bucket',
        'test-key'
      )
        .then(function(){
          return StorageService.delete_book_storage(
            'quietthyme',
            'test-bucket/test-key',
            'quietthyme'
          )
        })
        .then(function(data) {
          data.should.eql({ });
        })
        .then(done, done);
    });
  });
});
