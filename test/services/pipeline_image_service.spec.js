var should = require('should');
var PipelineImageService = require('../../src/services/pipeline_image_service');
//this is just simple integration testing
describe('ImagePipelineService', function() {
  describe('#download_cover_by_isbn()', function() {
    it('Should fail if isbn and isb13 are missing', function() {
      should(function() {
        return PipelineImageService.generate_amazon_data_set('') == null;
      });
    });

    it('Should fail when downloading an invalid image from amazon', function(
      done
    ) {
      var data_set = PipelineImageService.generate_amazon_data_set(
        '0971633896'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });

    it('Should download an image from amazon', function(done) {
      var data_set = PipelineImageService.generate_amazon_data_set(
        '0971633894'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .then(function(resp) {
          resp.headers['content-type'].should.eql('image/jpeg');
        })
        .then(done, done);
    });

    it('Should fail when downloading an invalid image from openlibrary', function(
      done
    ) {
      var data_set = PipelineImageService.generate_openlibrary_data_set(
        '0971633896'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });

    it('Should download an image from openlibrary', function(done) {
      var data_set = PipelineImageService.generate_openlibrary_data_set(
        '0971633894'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .then(function(resp) {
          resp.headers['content-type'].should.eql('image/jpeg');
        })
        .then(done, done);
    });

    it('Should download an isbn13 from openlibrary when provided one.', function(
      done
    ) {
      var data_set = PipelineImageService.generate_openlibrary_data_set(
        '9780060529703'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .then(function(resp) {
          resp.headers['content-type'].should.eql('image/jpeg');
        })
        .then(done, done)
        .done();
    });
  });

  describe('#generate_goodreads_data_set()', function() {
    it('Should fail if url missing', function() {
      should(function() {
        return PipelineImageService.generate_goodreads_data_set('') == null;
      });
    });

    it('Should fail when downloading an invalid image', function(done) {
      var data_set = PipelineImageService.generate_goodreads_data_set(
        'http://www.example.com/notreal.jpg'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });

    it('Should fail when downloading "nophoto" image', function() {
      should(function() {
        return (
          PipelineImageService.generate_goodreads_data_set(
            'https://s.gr-assets.com/assets/nophoto/book/111x148-6204a98ba2aba2d1aa07b9bea87124f8.png'
          ) == null
        );
      });
    });

    it('Should download an image by url', function(done) {
      var data_set = PipelineImageService.generate_goodreads_data_set(
        'https://d.gr-assets.com/books/1309286860m/1233.jpg'
      );
      PipelineImageService.generate_download_cover_promise(
        data_set.url,
        data_set._type
      )
        .then(function(resp) {
          resp.headers['content-type'].should.eql('image/jpeg');
          console.log(resp.data.length);
        })
        .then(done, done);
    });
  });

  describe.skip('#generate_request_fallbacks()', function() {
    it('Should return empty array if no isbns and no link data', function() {
      CoverArtService.generate_request_fallbacks(
        {},
        null
      ).should.have.a.lengthOf(0);
    });

    it('Should return an array if has isbns and no link data', function() {
      CoverArtService.generate_request_fallbacks(
        {
          isbn: '12345',
        },
        null
      ).should.have.a.lengthOf(2);
    });

    it('Should return an array if has link data', function() {
      CoverArtService.generate_request_fallbacks({}, {}).should.have.a.lengthOf(
        1
      );
    });
  });

  describe.skip('#retrieve_cover_with_fallback()', function() {
    it('Should fail when no data is present.', function(done) {
      CoverArtService.retrieve_cover_with_fallback({}, null)
        .fail(function(err) {
          err.should.be.a.Error;
        })
        .then(done, done);
    });

    it('Should fallback from invalid isbn to download goodreads cover', function(
      done
    ) {
      CoverArtService.retrieve_cover_with_fallback(
        { type: 'isbn', isbn: '12345678' },
        {
          type: 'url',
          source: 'goodreads',
          url: 'https://d.gr-assets.com/books/1309286860m/1233.jpg',
          identifier: '1233',
        }
      )
        .spread(function(body, content_type, storage_key) {
          content_type.should.eql('image/jpeg');
          storage_key.should.eql('images/goodreads_1233.jpg');
          console.log(body.length);
        })
        .then(done, done);
    });
  });
});
