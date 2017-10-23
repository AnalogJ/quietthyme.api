var should = require('should');
var DBService = require('../../src/services/db_service');
var q = require('q');
var fs = require('fs');
var path = require('path');
//this is just simple integration testing
describe('DBService', function() {
  describe('#listTables()', function() {
    it('should correctly list all tables', function(done) {
      DBService.listTables()
        .then(function(tables) {
          tables.should.eql([
            'quietthyme-api-test-books',
            'quietthyme-api-test-credentials',
            'quietthyme-api-test-users',
          ]);
        })
        .then(done, done);
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // User Table Methods
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe('#createUser()', function() {
    it('should correctly createUser', function(done) {
      var user = {
        first_name: 'test1',
        last_name: 'last',
        email: 'test1@example.com',
        password_hash:
          '$2a$10$deIH248Ql0zPgy1qGz8LhOdC6rVimyXwxzPPcmbqvsIv9p5wkm2L6',
        catalog_token: 'lousing-bobwhite-angled-augers',
        plan: 'none',
        library_uuid: '',
        stripe_sub_id: '',
      };

      DBService.createUser(user)
        .then(function(userresp) {
          should.exist(userresp.uid);
          userresp.first_name.should.eql('test1');
          userresp.last_name.should.eql('last');
          userresp.email.should.eql('test1@example.com');
          userresp.catalog_token.should.eql('lousing-bobwhite-angled-augers');
          userresp.plan.should.eql('none');
          should.not.exist(userresp.library_uuid); //empty strings are converted to null.
        })
        .then(done, done);
    });
  });

  describe('#updateUserPlan()', function() {
    before(function(done) {
      var user = {
        name: 'testplan',
        email: 'testplan@example.com',
        password_hash: 'testplanhash',
        catalog_token: 'testplancatalog',
      };
      DBService.createUser(user).then(function() {}).then(done, done);
    });
    it('should correctly update user plan', function(done) {
      DBService.updateUserPlan('test-uuid-plan', 'basic', 'subscriptionid1')
        .then(function(resp) {
          resp.should.eql({});
        })
        .then(done, done);
    });
  });

  describe('#findUserById()', function() {
    var uid;
    before(function(done) {
      var user = {
        name: 'testid',
        email: 'testid@example.com',
        password_hash: 'testidhash',
        catalog_token: 'testidcatalog',
      };
      DBService.createUser(user)
        .then(function(user_data) {
          uid = user_data.uid;
        })
        .then(done, done);
    });
    it('should correctly find user', function(done) {
      DBService.findUserById(uid)
        .then(function(user) {
          user.uid.should.eql(uid);
          user.plan.should.eql('none');
          user.email.should.eql('testid@example.com');
          should.exist(user.uid);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });

    it('should return null when user does not exist', function(done) {
      DBService.findUserById('doesnotexist')
        .then(function(user) {
          should.not.exist(user);
        })
        .then(done, done);
    });

    it('should raise an error when user id is null', function(done) {
      DBService.findUserById('')
        .fail(function(error) {
          error.should.be.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#findUserByEmail()', function() {
    before(function(done) {
      var user = {
        name: 'test2',
        email: 'test2@example.com',
        password_hash: 'test2hash',
        catalog_token: 'test2catalog',
      };
      DBService.createUser(user).then(function() {}).then(done, done);
    });
    it('should correctly find user', function(done) {
      DBService.findUserByEmail('test2@example.com')
        .then(function(user) {
          user.plan.should.eql('none');
          user.email.should.eql('test2@example.com');
          should.exist(user.uid);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });
    it('should return null when user does not exist', function(done) {
      DBService.findUserByEmail('doesnotexist@example.com')
        .then(function(user) {
          should.not.exist(user);
        })
        .then(done, done);
    });
    it('should raise an error when user email is null', function(done) {
      DBService.findUserByEmail('')
        .fail(function(error) {
          error.should.be.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#findUserByCatalogToken()', function() {
    before(function(done) {
      var user = {
        name: 'test3',
        email: 'test3@example.com',
        password_hash: 'test3hash',
        catalog_token: 'test3catalog',
      };
      DBService.createUser(user).then(function() {}).then(done, done);
    });
    it('should correctly findUser', function(done) {
      DBService.findUserByCatalogToken('test3catalog')
        .then(function(user) {
          user.plan.should.eql('none');
          user.email.should.eql('test3@example.com');
          should.exist(user.uid);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });
    it('should return null when user does not exist', function(done) {
      DBService.findUserByCatalogToken('doesnotexist')
        .then(function(user) {
          should.not.exist(user);
        })
        .then(done, done);
    });
    it('should raise an error when user email is null', function(done) {
      DBService.findUserByCatalogToken('')
        .fail(function(error) {
          error.should.be.an.Error;
        })
        .then(done, done);
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Credential Table Methods
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe('#createCredential()', function() {
    it('should correctly create credential', function(done) {
      var credential = {
        user_id: '123-456-789',
        service_type: 'dropbox',
        service_id: '12345',
        email: 'test@example.com',
        oauth: { test: 'TEst' },
      };
      DBService.createCredential(credential)
        .then(function(credential_resp) {
          should.exist(credential_resp.id);
          credential_resp.user_id.should.eql('123-456-789');
          credential_resp.service_type.should.eql('dropbox');
          credential_resp.service_id.should.eql('12345');
          credential_resp.email.should.eql('test@example.com');
          credential_resp.oauth.should.eql({ test: 'TEst' });
        })
        .then(done, done);
    });
  });

  describe('#findCredentialById()', function() {
    var credential_id;
    before(function(done) {
      DBService.createCredential({
        user_id: 'user-id',
        service_type: 'dropbox',
        service_id: '12345',
        email: 'test@example.com',
        oauth: { test: 'TEst' },
      })
        .then(function(credential_data) {
          credential_id = credential_data.id;
        })
        .then(done, done);
    });
    it('should correctly find credential', function(done) {
      DBService.findCredentialById(credential_id)
        .then(function(credential) {
          credential.user_id.should.eql('user-id');
          credential.id.should.eql(credential_id);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });

    it('should correctly find credential if user_id is specified', function(
      done
    ) {
      DBService.findCredentialById(credential_id, 'user-id')
        .then(function(credential) {
          credential.user_id.should.eql('user-id');
          credential.id.should.eql(credential_id);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });

    it('should correctly filter all credential if unknown user_id is specified', function(
      done
    ) {
      DBService.findCredentialById(credential_id, 'does-not-exist-user-id')
        .then(function(credential) {
          should.not.exist(credential);
        })
        .then(done, done);
    });

    it('should raise an error when credential id is null', function(done) {
      DBService.findCredentialById('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#findCredentialByServiceId()', function() {
    var credential_id;
    before(function(done) {
      DBService.createCredential({
        user_id: 'user-service-id',
        service_type: 'dropbox',
        service_id: 'service-id-1234',
        email: 'test@example.com',
        oauth: { test: 'TEst' },
      })
        .then(function(credential_data) {
          credential_id = credential_data.id;
        })
        .then(done, done);
    });
    it('should correctly find credential', function(done) {
      DBService.findCredentialByServiceId('service-id-1234')
        .then(function(credential) {
          credential.user_id.should.eql('user-service-id');
          credential.id.should.eql(credential_id);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });

    it('should raise an error when service id is null', function(done) {
      DBService.findCredentialByServiceId('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#findCredentialsByUserId()', function() {
    before(function(done) {
      DBService.createCredential({
        user_id: 'user-cred-query-id',
        service_type: 'dropbox',
        service_id: 'service-id-1234',
        email: 'test@example.com',
        oauth: { test: 'TEst' },
      })
        .then(function() {
          return DBService.createCredential({
            user_id: 'user-cred-query-id',
            service_type: 'dropbox',
            service_id: 'service-id-1234',
            email: 'test@example.com',
            oauth: { test: 'TEst' },
          });
        })
        .then(function() {
          return DBService.createCredential({
            user_id: 'user-cred-query-id',
            service_type: 'dropbox',
            service_id: 'service-id-1234',
            email: 'test@example.com',
            oauth: { test: 'TEst' },
          });
        })
        .then(function() {})
        .then(done, done);
    });
    it('should correctly find credential', function(done) {
      DBService.findCredentialsByUserId('user-cred-query-id')
        .then(function(credentials) {
          credentials.length.should.eql(3);
          credentials[0].user_id.should.eql('user-cred-query-id');
          credentials[0].service_type.should.eql('dropbox');
          credentials[0].service_id.should.eql('service-id-1234');
          credentials[0].email.should.eql('test@example.com');
        })
        .then(done, done);
    });

    it('should raise an error when user id is null', function(done) {
      DBService.findCredentialsByUserId('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#updateCredential()', function() {
    var credential_id;
    before(function(done) {
      DBService.createCredential({
        user_id: 'user-id',
        service_type: 'dropbox',
        service_id: '12345',
        email: 'test@example.com',
        oauth: { test: 'TEst' },
      })
        .then(function(credential_data) {
          credential_id = credential_data.id;
        })
        .then(done, done);
    });
    it('should correctly update credential', function(done) {
      DBService.updateCredential(credential_id, {
        event_cursor: 'event-cursor',
      })
        .then(function(credential) {
          credential.should.eql({});
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });

    it('should correctly update credential and return values', function(done) {
      DBService.updateCredential(
        credential_id,
        { event_cursor: 'event-cursor-value' },
        true
      )
        .then(function(credential) {
          credential.event_cursor.should.eql('event-cursor-value');
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Book Table Methods
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe('#createBook()', function() {
    it('should correctly create minimal book', function(done) {
      var book = {
        user_id: 'user-id',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/1234',
        storage_filename: 'book',
        storage_format: 'epub',
        title: 'this is my book title',
      };
      DBService.createBook(book)
        .then(function(book_data) {
          book_data.user_id.should.eql('user-id');
        })
        .then(done, done);
    });
    it('should correctly create full book from calibre', function(done) {
      var book = {
        user_id: 'user-id',
        // credential_id: 'credential-create-id',
        // storage_size: 123456,
        // storage_identifier: 'storage-id/test/1234',
        // storage_filename: 'book',
        // storage_format: 'epub',
        // title: 'this is my book title'

        amazon_id: '0061840254',
        authors: ['Ian Douglas'],
        primary_author: 'Ian Douglas',
        average_rating: 8,
        barnesnoble_id: 'w/earth-strike-ian-douglas/1018819002',
        calibre_id: '2ac79e4a-b0f3-4307-8f92-f58ea050d38d',
        google_id: 'i2b2zhEjxvkC',
        isbn: '9780061840258',
        last_modified: '2017-03-04T20:17:51Z',
        published_date: '2017-03-04T20:17:51Z',
        publisher: 'HarperCollins',
        series_name: 'Star Carrier',
        series_number: '1',
        short_summary:
          "<blockquote><p>The first book in the epic saga of humankind's war of transcendence</p><p>There is a milestone in the evolution of every sentient race, a Tech Singularity Event, when the species achieves transcendence through its technological advances. Now the creatures known as humans are near this momentous turning point.</p><p>But an armed threat is approaching from deepest space, determined to prevent humankind from crossing over that boundary—by total annihilation if necessary.</p></blockquote><p>To the Sh'daar, the driving technologies of transcendent change are anathema and must be obliterated from the universe—along with those who would employ them. As their great warships destroy everything in their path en route to the Sol system, the human Confederation government falls into dangerous disarray. There is but one hope, and it rests with a rogue Navy Admiral, commander of the kilometer-long star carrier America, as he leads his courageous fighters deep into enemy space towards humankind's greatest conflict—and quite possibly its last.</p>",
        tags: [
          'Fiction - Science Fiction',
          'American Science Fiction And Fantasy',
          'Space warfare',
          'Science Fiction - Military',
          'Fiction',
          'Science Fiction',
          'Science Fiction - General',
          'Human-Alien Encounters',
          'Adventure',
          'Military',
          'General',
          'Science Fiction And Fantasy',
        ],
        title: 'Earth Strike',
        user_categories: {},
        user_metadata: {},
      };
      DBService.createBook(book)
        .then(function(book_data) {
          book_data.user_id.should.eql('user-id');
        })
        .then(done, done);
    });

    it('should correctly create another complex book from calibre', function(
      done
    ) {
      var book = {
        user_id: 'e67e74f3-b221-48c5-8316-b14651f81a7c',
        credential_id: 'b43acf58-81a3-4117-952d-7d2566c65321',
        storage_type: 'dropbox',
        storage_identifier: 'FicKnmotZ4UrkH0cT-bOeZhiZV1GV1LQginsbwdXnL0M=',
        storage_filename: 'Gibson, William - The Peripheral (2014)',
        storage_format: '.mobi',
        storage_size: 792300,
        title: 'The Peripheral',
        published_date: '2014-11-28T00:00:00Z',
        authors: ['William Gibson'],
        primary_author: 'William Gibson',
        isbn: '9780399158445',
        isbn10: '0399158448',
        num_pages: 485,
        average_rating: 3.94,
        ratings_count: 8648,
        goodreads_id: '20821159',
        short_summary:
          '**William Gibson returns with his first novel since 2010’s _New York Times_–bestselling _Zero History_.** \n\nWhere Flynne and her brother, Burton, live, jobs outside the drug business are rare. Fortunately, Burton has his veteran’s benefits, for neural damage he suffered from implants during his time in the USMC’s elite Haptic Recon force. Then one night Burton has to go out, but there’s a job he’s supposed to do—a job Flynne didn’t know he had. Beta-testing part of a new game, he tells her. The job seems to be simple: work a perimeter around the image of a tower building. Little buglike things turn up. He’s supposed to get in their way, edge them back. That’s all there is to it. He’s offering Flynne a good price to take over for him. What she sees, though, isn’t what Burton told her to expect. It might be a game, but it might also be murder.',
        tags: [
          'sci-fi',
          'fiction',
          'cyberpunk',
          'scifi',
          'sf',
          'owned',
          'science-fiction',
          'favorites',
          'library',
          'time-travel',
          'kindle',
          'abandoned',
          'sci-fi-fantasy',
          'to-buy',
          'audiobook',
          'dystopia',
          'read-in-2015',
          'audio',
          'dystopian',
          'thriller',
          'audiobooks',
          'speculative-fiction',
          'novels',
          'books-i-own',
          'ebooks',
          'to-read-fiction',
          'fantasy',
          'mystery',
          'didn-t-finish',
          'unfinished',
          'scifi-fantasy',
          'book-club',
          'science-fiction-fantasy',
          'william-gibson',
          'near-future',
          'wish-list',
          'adult',
          'speculative',
          'did-not-finish',
          'sff',
          'literature',
          'owned-books',
          'never-finished',
          'audible',
          'technology',
          'novel',
          'read-in-2014',
          'e-book',
          'post-apocalyptic',
          'signed',
          'library-book',
          'gave-up',
          'recommended',
          'read-2015',
          'to-get',
          'london',
          'calibre',
          'couldn-t-finish',
          'read-2014',
          'first-reads',
          'gave-up-on',
          'on-hold',
          'fantasy-sci-fi',
          'fiction-to-read',
          'fantasy-scifi',
          'sciencefiction',
          'on-deck',
          'audio-book',
          'english',
          'sci-fi-and-fantasy',
          'books',
          'sf-fantasy',
          'read-in-2017',
          'read-2016',
          'read-in-2016',
          'shelfari-wishlist',
          'books-read-2015',
          'my-library',
          'contemporary',
          'hardcover',
          'post-apocalypse',
          'reviewed',
          'dnf',
          'ciencia-ficción',
          'to-read-scifi',
          'e-books',
          'paused',
          'hardback',
          'dystopian-sci-fi',
          'library-books',
          'owned-but-unread',
          'owned-to-read',
          'borrowed',
          'nanotechnology',
          'spec-fic',
          'cyber-punk',
          'dropped',
        ],
        cover:
          'quietthyme-api-beta-content/58882a48d919c2198e333347d66b1700/covers/8b42b9d134f0992cc29d3b3241f85f8bd59ac7ff.jpg',
        last_modified: '',
      };
      DBService.createBook(book)
        .then(function(book_data) {
          book_data.user_id.should.eql('e67e74f3-b221-48c5-8316-b14651f81a7c');
        })
        .then(done, done);
    });
  });

  describe('#findBookById()', function() {
    var book_id;
    before(function(done) {
      var book = {
        user_id: 'user-id',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/1234',
        storage_filename: 'book',
        storage_format: 'epub',
        title: 'this is my book title'
      };
      DBService.createBook(book)
        .then(function(book_data) {
          book_id = book_data.id;
        })
        .then(done, done);
    });
    it('should correctly find book', function(done) {
      DBService.findBookById(book_id, 'user-id')
        .then(function(book_data) {
          book_data.user_id.should.eql('user-id');
          book_data.id.should.eql(book_id);
          // should.not.exist(user.password_hash);
          // should.not.exist(user.stripe_sub_id);
        })
        .then(done, done);
    });

    it('should raise an error when book id is null', function(done) {
      DBService.findBookById('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#findBooksByUserId()', function() {
    before(function(done) {
      var book = {
        user_id: 'find-book-user-id',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/1234',
        storage_filename: 'book',
        storage_format: 'epub',
        title: 'this is my book title'
      };
      DBService.createBook(book)
        .then(function() {
          return DBService.createBook(book);
        })
        .then(function() {
          return DBService.createBook(book);
        })
        .then(function() {})
        .then(done, done);
    });
    it('should correctly find book', function(done) {
      DBService.findBooksByUserId('find-book-user-id')
        .then(function(resp_data) {
          resp_data.Items.length.should.eql(3);
        })
        .then(done, done);
    });

    it('should raise an error when user id is null', function(done) {
      DBService.findBooksByUserId('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });
  });

  describe('#findBooks()', function() {
    before(function(done) {
      var book1 = {
        user_id: 'find-book',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/1',
        storage_filename: 'book2',
        storage_format: 'epub',
        title: 'title1',
      };
      var book2 = {
        user_id: 'find-book',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/2',
        storage_filename: 'book1',
        storage_format: 'pdf',
        title: 'title2',
      };
      var book3 = {
        user_id: 'find-book',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/3',
        storage_filename: 'book2',
        storage_format: 'pdf',
        title: 'title3',
      };
      var book4 = {
        user_id: 'find-book',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/4',
        storage_filename: 'book1',
        storage_format: 'epub',
        authors: ['test author', 'hello world'],
        primary_author: 'test author',
        title: 'title4',
      };
      DBService.createBook(book1)
        .then(function() {
          return DBService.createBook(book2);
        })
        .then(function() {
          return DBService.createBook(book3);
        })
        .then(function() {
          return DBService.createBook(book4);
        })
        .then(function() {})
        .then(done, done);
    });
    it('should correctly find book after filtering', function(done) {
      DBService.findBooks('find-book', { storage_format: 'pdf' })
        .then(function(resp_data) {
          resp_data.Items.length.should.eql(2);
        })
        .then(function() {
          return DBService.findBooks('find-book', { title: 'title4' });
        })
        .then(function(resp_data) {
          resp_data.Items.length.should.eql(1);
        })
        .then(done, done);
    });

    it('should correctly handle empty filter', function(done) {
      DBService.findBooks('find-book', {})
        .then(function(resp_data) {
          resp_data.Items.length.should.eql(4);
        })
        .then(done, done);
    });

    it('should correctly handle multiple filters', function(done) {
      DBService.findBooks('find-book', {
        storage_format: 'pdf',
        storage_identifier: 'storage-id/test/2',
        storage_filename: 'book1',
      })
        .then(function(resp_data) {
          resp_data.Items.length.should.eql(1);
        })
        .then(done, done);
    });

    it('should correctly handle author contains complex filter', function(
      done
    ) {
      DBService.findBooks('find-book', { authors: { contains: 'test author' } })
        .then(function(resp_data) {
          resp_data.Items.length.should.eql(1);
          resp_data.Items[0].title.should.eql('title4');
        })
        .then(done, done);
    });

    it('should correctly paginate with page limits', function(done) {
      var found_items = [];
      function paginate(resp_data) {
        found_items = found_items.concat(resp_data.Items);
        if (resp_data.LastEvaluatedKey) {
          return DBService.findBooks(
            'find-book',
            { storage_filename: 'book2' },
            resp_data.LastEvaluatedKey,
            1
          ).then(paginate);
        } else {
          return found_items;
        }
      }

      DBService.findBooks('find-book', { storage_filename: 'book2' }, null, 1)
        .then(paginate)
        .then(function(items) {
          items.length.should.eql(2);
        })
        .then(done, done);
    });

    it('should raise an error when user id is null', function(done) {
      DBService.findBooks('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });

    describe('after loading 100 books', function() {
      before(function(done) {
        this.timeout(10000);

        var books_file = path.resolve(
          path.resolve(__dirname, '../fixtures/100_books.json')
        );
        var fake_books = JSON.parse(fs.readFileSync(books_file, 'utf8'));
        var promises = [];
        for (var ndx in fake_books) {
          var fake_book = fake_books[ndx];

          fake_book.user_id = 'find-books-100';
          fake_book.credential_id = 'find-books-100-credential-id';
          promises.push(DBService.createBook(fake_book));
        }

        q
          .allSettled(promises)
          .then(function(promises) {
            var failed = []
            for(let promise of promises){
              if(promise.state != 'fulfilled'){
                failed << promise;
              }
            }

            if(failed.length >0){
              console.error("Could not insert the following books")
              console.error(failed)
              throw "Could not populate books. look above for exact errors"
            }
          })
          .delay(1000)
          .then(done, done);
      });

      it('should correctly handle simple filters', function(done) {
        var found_items = [];
        function paginateBooks(user_id, query_data, page) {
          return DBService.findBooks(user_id, query_data, page).then(function(
            book_data
          ) {
            found_items = found_items.concat(book_data.Items);
            if (book_data.LastEvaluatedKey) {
              return paginateBooks(
                user_id,
                query_data,
                book_data.LastEvaluatedKey
              );
            } else {
              return q(found_items);
            }
          });
        }

        paginateBooks('find-books-100', { publisher: 'scalable Berkshire' })
          .then(function(_found_items) {
            _found_items.length.should.eql(1);
            _found_items[0].title.should.eql('A program navigate Designer');
          })
          .then(done, done);
      });

      it('should correctly handle author contains complex filter', function(
        done
      ) {
        var found_items = [];
        function paginateBooks(user_id, query_data, page) {
          return DBService.findBooks(user_id, query_data, page).then(function(
            book_data
          ) {
            found_items = found_items.concat(book_data.Items);
            if (book_data.LastEvaluatedKey) {
              return paginateBooks(
                user_id,
                query_data,
                book_data.LastEvaluatedKey
              );
            } else {
              return q(found_items);
            }
          });
        }

        paginateBooks('find-books-100', {
          authors: { contains: 'Alvina Romaguera' },
        })
          .then(function(_found_items) {

            _found_items.length.should.eql(1);
            _found_items[0].title.should.eql('A program navigate Designer');
          })
          .then(done, done);
      });
    });
  });

  describe('#updateBook()', function() {
    var book_id;
    before(function(done) {
      var book = {
        user_id: 'update-user-id',
        credential_id: 'credential-create-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/1234',
        storage_filename: 'book',
        storage_format: 'epub',
        title: 'this is my book title',
      };
      DBService.createBook(book)
        .then(function(book_data) {
          book_id = book_data.id;
        })
        .then(done, done);
    });
    it('should correctly update book', function(done) {
      DBService.updateBook(book_id, 'update-user-id', {
        storage_filename: 'updated_book_filename',
      })
        .then(function(book) {
          book.should.eql({});
        })
        .then(done, done);
    });

    it('should correctly update book and return values', function(done) {
      DBService.updateBook(
        book_id,
        'update-user-id',
        { storage_filename: 'updated_book_filename_2' },
        true
      )
        .then(function(book) {
          book.storage_filename.should.eql('updated_book_filename_2');
        })
        .then(done, done);
    });
  });

  describe('#deleteBookById()', function() {
    var book_id;
    before(function(done) {
      var book = {
        user_id: 'book-delete-user-id',
        credential_id: 'book-delete-credential-id',
        storage_size: 123456,
        storage_identifier: 'storage-id/test/1234',
        storage_filename: 'book',
        storage_format: 'epub',
        title: 'this is my book title',
      };
      DBService.createBook(book)
        .then(function(book_data) {
          book_id = book_data.id;
        })
        .then(done, done);
    });
    it('should correctly delete book', function(done) {
      DBService.deleteBookById(book_id, 'book-delete-user-id')
        .then(function(book_data) {
          book_data.id.should.eql(book_id);
        })
        .then(done, done);
    });

    it('should raise an error when book id is null', function(done) {
      DBService.deleteBookById('')
        .fail(function(error) {
          error.should.an.Error;
        })
        .then(done, done);
    });
  });
});
