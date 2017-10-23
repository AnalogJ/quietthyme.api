var faker = require('faker');
var fs = require('fs');
var all_books = [];
var number_of_books = 1000

for (var i = 0; i < number_of_books; i++) {
  var ext = faker.system.commonFileExt();
  var filename = faker.system.commonFileName(ext);
  var tags = [];
  if (faker.random.number(10) > 3) {
    //chance of having tags 70%
    for (var ti = 0; ti < faker.random.number(30); ti++) {
      tags.push(faker.random.words(2));
    }
  }

  var authors = [faker.name.findName()];
  if (faker.random.number(10) < 3) {
    authors.push(faker.name.findName());
  }

  var series_name = faker.random.number(10) > 5 ? faker.random.words(2) : '';

  var book = {
    storage_size: faker.random.number({ min: 10000, max: 5000000 }),
    storage_identifier:
      faker.random.words(3).split(' ').join('_') + '/' + filename,
    storage_filename: filename,
    storage_format: '.' + ext,

    title: faker.random.words(3),
    average_rating: faker.random.number(5),
    ratings_count: faker.random.number(5000),
    user_rating: faker.random.number(5),
    num_pages: faker.random.number(5000),
    short_summary: faker.lorem.paragraph(faker.random.number(15)),
    publisher: faker.random.number(10) > 5 ? faker.random.words() : '',
    published_date: faker.date.past(),
    tags: tags,
    authors: authors,
    primary_author: authors[0],
    last_modified: faker.date.recent(),

    series_name: series_name,
    series_number: (series_name ? faker.random.number(10) : 0).toString(),

    isbn: faker.random.number({ min: 1000000000000, max: 9999999999999 }).toString(),
    isbn10: faker.random.number({ min: 1000000000, max: 9999999999 }).toString(),

    // amazon_id: '0061840254',
    // authors: [ 'Ian Douglas' ],
    // average_rating: 8,
    // barnesnoble_id: 'w/earth-strike-ian-douglas/1018819002',
    // calibre_id: '2ac79e4a-b0f3-4307-8f92-f58ea050d38d',
    // google_id: 'i2b2zhEjxvkC',
    // isbn: '9780061840258',
    // last_modified: '2017-03-04T20:17:51.452429Z',
    // published_date: '2017-03-04T20:17:51.452423Z',
    // publisher: 'HarperCollins',
    // series_name: 'Star Carrier',
    // series_number: 1,
    // short_summary: '<blockquote><p>The first book in the epic saga of humankind\'s war of transcendence</p><p>There is a milestone in the evolution of every sentient race, a Tech Singularity Event, when the species achieves transcendence through its technological advances. Now the creatures known as humans are near this momentous turning point.</p><p>But an armed threat is approaching from deepest space, determined to prevent humankind from crossing over that boundary—by total annihilation if necessary.</p></blockquote><p>To the Sh\'daar, the driving technologies of transcendent change are anathema and must be obliterated from the universe—along with those who would employ them. As their great warships destroy everything in their path en route to the Sol system, the human Confederation government falls into dangerous disarray. There is but one hope, and it rests with a rogue Navy Admiral, commander of the kilometer-long star carrier America, as he leads his courageous fighters deep into enemy space towards humankind\'s greatest conflict—and quite possibly its last.</p>',
    // tags:
    //     [ 'Fiction - Science Fiction',
    //         'American Science Fiction And Fantasy',
    //         'Space warfare',
    //         'Science Fiction - Military',
    //         'Fiction',
    //         'Science Fiction',
    //         'Science Fiction - General',
    //         'Human-Alien Encounters',
    //         'Adventure',
    //         'Military',
    //         'General',
    //         'Science Fiction And Fantasy' ],
    // user_categories: {},
    // user_metadata: {}
  };

  all_books.push(book);
}

fs.writeFile(
  __dirname + `/${number_of_books}_books.json`,
  JSON.stringify(all_books, null, 4),
  function() {
    console.log(`${number_of_books} books generated successfully!`);
  }
);
