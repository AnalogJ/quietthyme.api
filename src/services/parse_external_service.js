'use strict';
const debug = require('debug')('quietthyme:ParseExternalService');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//this is a special function to merge parsed data from different sources together.
//by default.
var extend = require('node.extend');
var q = require('q');
var opf = require('opf.js');
var fs = require('fs');

var ParseExternalService = module.exports;

ParseExternalService.merge_parsed_data = function(
  book_default,
  additional_data
) {
  //the title and descripton should not be overridden if they have been provided by a default source already.

  if (book_default.title) {
    delete additional_data.title;
  }
  if (book_default.short_summary) {
    delete additional_data.short_summary;
  }

  //tags should only be added, not replaced.
  //TODO: ensure that only unique tags are added.
  if (book_default.tags && book_default.tags.length) {
    if (additional_data.tags && additional_data.tags.length) {
      book_default.tags.concat(additional_data.tags);
    }
    delete additional_data.tags;
  }
  return extend({}, book_default, additional_data);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// OPF Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseExternalService.read_opf_file = function(filepath) {
  var deferred = q.defer();

  fs.readFile(filepath, 'utf8', function(err, opf_content) {
    if (err) deferred.reject(new Error('Could not find file'));
    deferred.resolve(opf_content);
  });
  return deferred.promise
    .then(function(opf_content) {
      return opf.load(opf_content);
    })
    .then(ParseExternalService.parse_opf_data);
};

ParseExternalService.parse_opf_data = function(opf_metadata) {
  debug('Parse OPF data: %o', opf_metadata);

  var goodreads_identifier = opf_metadata.identifiers['GOODREADS'];
  var amazon_identifier = opf_metadata.identifiers['AMAZON'];
  var google_identifier = opf_metadata.identifiers['GOOGLE'];
  var ffiction_identifier = opf_metadata.identifiers['FF'];
  var barnesnoble_identifier = opf_metadata.identifiers['BARNESNOBLE'];
  var isbn_identifier = opf_metadata.identifiers['ISBN'];

  var meta_average_rating = opf_metadata.metadata['calibre:rating'];
  var meta_series_name = opf_metadata.metadata['calibre:series'];
  var meta_series_number = opf_metadata.metadata['calibre:series_index'];
  var subject_tags = opf_metadata.subjects;

  var parsed_book = {};
  parsed_book.title = opf_metadata.title || 'Unknown Title';
  // parsed_book.isbn = parsed_book.isbn || parsed_book.isbn || '';
  // parsed_book.isbn13 = parsed_book.isbn13 || parsed_book.isbn13 || ''; //isbn_identifier

  if (goodreads_identifier && goodreads_identifier.value) {
    parsed_book.goodreads_id = goodreads_identifier.value;
  }
  if (amazon_identifier && amazon_identifier.value) {
    parsed_book.amazon_id = amazon_identifier.value;
  }
  if (google_identifier && google_identifier.value) {
    parsed_book.google_id = google_identifier.value;
  }
  if (ffiction_identifier && ffiction_identifier.value) {
    parsed_book.ffiction_id = ffiction_identifier.value;
  }
  if (barnesnoble_identifier && barnesnoble_identifier.value) {
    parsed_book.barnesnoble_id = barnesnoble_identifier.value;
  }
  if (isbn_identifier && isbn_identifier.value) {
    if (isbn_identifier.value.length == 10) {
      parsed_book.isbn10 = isbn_identifier.value.replace(/\D/g, '');
    } else {
      parsed_book.isbn = isbn_identifier.value.replace(/\D/g, '');
    }
  }

  if (meta_average_rating) {
    parsed_book.average_rating = meta_average_rating | 0;
  }
  if (meta_series_name) {
    parsed_book.series_name = meta_series_name;
  }
  if (meta_series_number && meta_series_number) {
    parsed_book.series_number = meta_series_number | 0;
  }
  parsed_book.short_summary = opf_metadata.description || '';
  if (opf_metadata.date) {
    parsed_book.published_date = opf_metadata.date;
  }
  if (subject_tags.length) {
    parsed_book.tags = subject_tags;
  }

  var authors = [];
  opf_metadata.creators.forEach(function(creator) {
    var name = creator.value;

    if (!name) {
      return;
    }
    authors.push(name);
  });
  if (authors.length > 0) {
    parsed_book.authors = authors;
  }

  if (opf_metadata.publishers) {
    parsed_book.publisher = opf_metadata.publishers[0];
  }

  return parsed_book;
};

ParseExternalService.generate_opf_from_book = function(details) {
  var opf_doc = { identifiers: {}, tags: [], metadata: {} };

  if (details.goodreads_id)
    opf_doc.identifiers['GOODREADS'] = {
      value: details.goodreads_id,
      scheme: 'GOODREADS',
      id: null,
    };
  if (details.amazon_id)
    opf_doc.identifiers['AMAZON'] = {
      value: details.amazon_id,
      scheme: 'AMAZON',
      id: null,
    };
  if (details.google_id)
    opf_doc.identifiers['GOOGLE'] = {
      value: details.google_id,
      scheme: 'GOOGLE',
      id: null,
    };
  if (details.ffiction_id)
    opf_doc.identifiers['FF'] = {
      value: details.ffiction_id,
      scheme: 'FF',
      id: null,
    };
  if (details.barnesnoble_id)
    opf_doc.identifiers['BARNESNOBLE'] = {
      value: details.barnesnoble_id,
      scheme: 'BARNESNOBLE',
      id: null,
    };
  if (details.isbn || details.isbn10)
    opf_doc.identifiers['ISBN'] = {
      value: details.isbn || details.isbn10,
      scheme: 'ISBN',
      id: null,
    };
  if (details.title) opf_doc.title = details.title;

  if (details.short_summary) opf_doc.description = details.short_summary;

  if (details.tags.length > 0) opf_doc.subjects = details.tags;

  if (details.average_rating)
    opf_doc.metadata['calibre:rating'] = details.average_rating;
  if (details.series_name)
    opf_doc.metadata['calibre:series'] = details.series_name;
  if (details.series_number)
    opf_doc.metadata['calibre:series_index'] = details.series_number;

  if (details.authors && details.authors.length > 0) {
    opf_doc.creators = details.authors.map(function(author) {
      var data = {};
      data['file-as'] = author.name;
      data['value'] = author.name;
      data['role'] = 'aut';
      return data;
    });
  }

  return opf_doc;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Goodreads Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ParseExternalService.parse_goodreads_search_results = function(
  goodreads_response
) {
  var parsed_results = [];
  if (
    !(
      goodreads_response.GoodreadsResponse.search &&
      goodreads_response.GoodreadsResponse.search[0].results &&
      goodreads_response.GoodreadsResponse.search[0].results[0] &&
      goodreads_response.GoodreadsResponse.search[0].results[0].work &&
      goodreads_response.GoodreadsResponse.search[0].results[0].work[0]
    )
  ) {
    return parsed_results;
  } else {
    parsed_results = goodreads_response.GoodreadsResponse.search[0].results[0].work.map(
      function(item) {
        return {
          id: item.best_book[0].id[0]['_'],
          title: item.best_book[0].title[0],
          author: item.best_book[0].author[0].name[0],
          image_url: item.best_book[0].image_url[0],
          average_rating: parseFloat(item.average_rating[0]),
          ratings_count: item.ratings_count[0]['_'],
          publication_year: item.original_publication_year[0]['_'],
        };
      }
    );
  }
  //    else if (goodreads_response.search.results.work) {
  //        var item = goodreads_response.search.results.work;
  //        parsed_results.push({
  //            id: item.best_book.id['#'],
  //            title: item.best_book.title,
  //            author: item.best_book.author.name,
  //            image_url: item.best_book.image_url,
  //            average_rating: parseFloat(item.average_rating),
  //            ratings_count: item.ratings_count['#'],
  //            publication_year: item.original_publication_year['#']
  //        });
  //    }

  return parsed_results;
};

ParseExternalService.parse_goodreads_search_author = function(
  goodreads_response
) {
  var parsed_results = [];
  //seems like the response for searching author by name is always just 1 result.
  if (goodreads_response.author) {
    parsed_results.push({
      external: true,
      id: goodreads_response.author['@'].id,
      name: goodreads_response.author.name,
    });
  }
  return parsed_results;
};

ParseExternalService.parse_goodreads_book_details = function(response) {
  if (
    !(
      response.GoodreadsResponse &&
      response.GoodreadsResponse.book &&
      response.GoodreadsResponse.book[0]
    )
  ) {
    throw new Error('Invalid Goodreads Response');
  }
  var goodreads_book = response.GoodreadsResponse.book[0];

  var parsed_book = {};
  parsed_book.title = goodreads_book.title[0]
    .replace(/ *\([^)]*\) */g, '')
    .replace(/ *\[[^\]]*\] */g, ''); //sometimes goodreads includes the series information in the title. Lets strip that out.
  parsed_book.isbn = goodreads_book.isbn13[0];
  parsed_book.isbn10 = goodreads_book.isbn[0];
  parsed_book.amazon_id = goodreads_book.asin[0] || null; //if the asin is an empty string, return null
  parsed_book.num_pages = goodreads_book.num_pages[0] | 0;
  parsed_book.average_rating = parseFloat(goodreads_book.average_rating[0]);
  parsed_book.ratings_count = goodreads_book.ratings_count[0] | 0;
  parsed_book.goodreads_id = goodreads_book.id[0];

  if (
    goodreads_book.series_works &&
    goodreads_book.series_works[0] &&
    goodreads_book.series_works[0].series_work &&
    goodreads_book.series_works[0].series_work[0]
  ) {
    var series_work = goodreads_book.series_works[0].series_work[0];
    parsed_book.series_name = series_work.series[0].title[0].trim();
    parsed_book.series_number = series_work.user_position[0] | 0;
  }
  //    else if (goodreads_book.series_works && goodreads_book.series_works[0]) {
  //        //TODO:var series_work = goodreads_book.series_works[0].series_work[0];
  //        parsed_book.series_id = goodreads_book.series_works.series_work.series.id;
  //        parsed_book.series_name = goodreads_book.series_works.series_work.series.title;
  //        parsed_book.series_number = (goodreads_book.series_works.series_work.user_position | 0);
  //    }

  parsed_book.short_summary = goodreads_book.description[0];
  parsed_book.published_date = new Date(
    goodreads_book.publication_year[0] | 0,
    goodreads_book.publication_month[0] | 0,
    goodreads_book.publication_day[0] | 0
  );
  //generate tags
  //sort them
  //reject low value tags and conver to strings in one loop
  goodreads_book.popular_shelves[0].shelf = goodreads_book.popular_shelves[0].shelf.sort(
    function(a, b) {
      var a_count = a['$'].count | 0;
      var b_count = b['$'].count | 0;
      return b_count - a_count;
    }
  );
  parsed_book.tags = goodreads_book.popular_shelves[0].shelf.reduce(function(
    prev,
    current,
    array
  ) {
    var tag = current['$'].name;
    if (tag == 'to-read' || tag == 'currently-reading' || tag == 'default') {
      return prev;
    }

    if ((current['$'].count | 0) <= 2) {
      return prev;
    }

    prev.push(tag);
    return prev;
  }, []);

  if (
    goodreads_book.authors &&
    goodreads_book.authors[0] &&
    goodreads_book.authors[0].author
  ) {
    parsed_book.authors = goodreads_book.authors[0].author.map(function(item) {
      // var author = {};
      // author.name = item.name[0];
      // author.goodreads_id = item.id[0]
      return item.name[0];
    });
  }
  //    //TODO: tihs shoudl eb an array
  //    else if(goodreads_book.authors.author instanceof Array) {
  //
  //        parsed_book.authors = goodreads_book.authors.author.map(function (item) {
  //            var author = {};
  //            author.name = item.name;
  //            author.id = item.id;
  //            return author;
  //        })
  //    }
  //    else if (goodreads_book.authors) {
  //
  //        parsed_book.authors = [];
  //        parsed_book.authors.push({
  //            "name": goodreads_book.authors.author.name,
  //            "id": goodreads_book.authors.author.id
  //        })
  //    }

  if (goodreads_book.image_url && goodreads_book.image_url[0]) {
    var str = goodreads_book.image_url[0];
    var replaced = str.replace(
      /(https?:\/\/images\.gr-assets\.com\/books\/[a-zA-Z0-9]{9,13})m(\/[a-zA-Z0-9]{5,9}\.jpg)/,
      '$1l$2'
    );
    debug('Goodreads Image URL Replaced: %s', replaced);
    parsed_book.image = {
      identifier: replaced,
    };
  }

  return parsed_book;
};

ParseExternalService.parse_goodreads_shelves = function(response) {
  if (
    !(
      response.GoodreadsResponse &&
      response.GoodreadsResponse.shelves &&
      response.GoodreadsResponse.shelves[0]
    )
  ) {
    throw new Error('Invalid Goodreads Response');
  }
  var goodreads_shelves = response.GoodreadsResponse.shelves[0];

  var parsed_shelves = goodreads_shelves.user_shelf.map(function(
    goodreads_shelf
  ) {
    var parsed_shelf = {};
    parsed_shelf['name'] = goodreads_shelf['name'][0];

    return parsed_shelf;
  });
  return parsed_shelves;
};

ParseExternalService.parse_goodreads_shelf_content = function(response) {
  if (
    !(
      response.GoodreadsResponse &&
      response.GoodreadsResponse.reviews &&
      response.GoodreadsResponse.reviews[0]
    )
  ) {
    throw new Error('Invalid Goodreads Response');
  }
  var goodreads_shelf_content = response.GoodreadsResponse.reviews[0];
  if (!goodreads_shelf_content.review) {
    return [];
  }
  var parsed_shelf_content = goodreads_shelf_content.review.map(function(
    goodreads_shelf_book
  ) {
    var parsed_shelf_book = {};
    //parse book
    parsed_shelf_book['date_added'] = new Date(
      goodreads_shelf_book['date_added'][0]
    );
    if (
      goodreads_shelf_book.book[0].isbn13 &&
      typeof goodreads_shelf_book.book[0].isbn13[0] == 'string'
    ) {
      parsed_shelf_book.isbn = goodreads_shelf_book.book[0].isbn13[0];
    }
    if (
      goodreads_shelf_book.book[0].isbn &&
      typeof goodreads_shelf_book.book[0].isbn[0] == 'string'
    ) {
      parsed_shelf_book.isbn10 = goodreads_shelf_book.book[0].isbn[0];
    }
    parsed_shelf_book.goodreads_id = goodreads_shelf_book.book[0].id[0]['_'];

    return parsed_shelf_book;
  });
  return parsed_shelf_content;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Filename Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Given a filename (without extension), which may include [Epub] {Mobi} etc, remove all format specific data from the filename, and return it.
 * Assume that the filename does not have an extension (extension has arleady been removed)
 * @param filename
 */
ParseExternalService.clean_filename = function(filename) {
  if (!filename) {
    throw new Exception('Invalid filename, null or empty');
  }

  filename = filename.replace(/\[(.+?)\]/g, ''); //remove square brackets
  filename = filename.replace(/\((.+?)\)/g, ''); //remove braces
  filename = filename.replace(/\./g, ' '); //replace periods
  filename = filename.replace(/\_/g, ' '); //replace underscores

  return filename.trim();
};

ParseExternalService.parse_filename = function(cleaned_filename) {
  var parts = cleaned_filename.split('-');
  if (parts.length != 2) {
    //too complicated, return the filename.
    return {
      title: cleaned_filename,
    };
  }

  var preposition_list = [
    'as',
    'at',
    'in',
    'of',
    'on',
    'the',
    'to',
    'too',
    'with',
    'for',
  ];
  var first_part = parts[0].toLowerCase().split(' ');
  var second_part = parts[1].toLowerCase().split(' ');

  for (var ndx in preposition_list) {
    if (first_part.indexOf(preposition_list[ndx]) > -1) {
      //assume that this part is the title,
      return {
        title: parts[0],
        authors: [Author.normalize_author_name(parts[1])],
      };
    }
  }

  for (var ndx in preposition_list) {
    if (second_part.indexOf(preposition_list[ndx]) > -1) {
      //assume that this part is the title,
      return {
        title: parts[1],
        authors: [Author.normalize_author_name(parts[0])],
      };
    }
  }
  //neither part was detected as the title.
  return {
    title: cleaned_filename,
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// API Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//mostly this function should just be a cleanup/conversion of exsting data that will be added as is.
ParseExternalService.parse_api_metadata = function(api_metadata) {
  var parsed_book = api_metadata;
  parsed_book.average_rating = parseFloat(parsed_book.average_rating | 0);

  if (parsed_book.series_number) {
    parsed_book.series_number = parsed_book.series_number | 0;
  }

  var pubdate = new Date(parsed_book.published_date); //TODO: this doesnt seem to work.
  if (isValidDate(pubdate)) {
    parsed_book.published_date = pubdate;
  }

  //thumbnail/cover art is uploaded seperately
  //parsed_book.image = {
  //    promise: q({'data':new Buffer(calibre_metadata.thumbnail[calibre_metadata.thumbnail.length-1], "base64"),'headers':{}})
  //}
  //TODO: handle the coverart default from the thumbnail entry

  var last_modified = new Date(parsed_book.last_modified);
  if (isValidDate(last_modified)) {
    parsed_book.last_modified = last_modified;
  }

  return parsed_book;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Calibre Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isValidDate(d) {
  if (Object.prototype.toString.call(d) !== '[object Date]') return false;
  return !isNaN(d.getTime());
}
