'use strict';
const debug = require('debug')('quietthyme:PipelineImageService');
/*#######################################################################
 *#######################################################################
 * The Image pipeline service is used to retieve book cover art from various sources asynchronously.
 * The method takes in a list of ____ and
 * retrieved, the flatten_data_sets method is run to merge the data into a single parsed book that we can use to update
 * the book data in waterline.
 *
 * Supported image_pipleine data set type:
 *      goodreads - cover retrieved from goodreads
 *      amazon - cover retrieved from amazon
 *      file - cover retreived from filesystem
 *      manual - cover manulally uploaded by user
 *      calibre - cover retrived from calibre database sync.
 *      embedded - cover retrieved from embedded book metadata (eg. cover.jpg inside epub, pdf first page)
 *      openlibrary - cover retrieved from openlibrary by isbn.
 *
 *
 *#######################################################################
 *#######################################################################
 * */
var q = require('q');
var Constants = require('../common/constants');
var _ = require('lodash');
var PipelineImageService = module.exports;
var fs = require('fs');
//When given an array of image data_sets, sort the potential data_sets and then will convert each to a fallback-enabled
// wrapped promise and use q-combinators method to get the first successfully retrieved image.
PipelineImageService.process_image_pipeline = function(
  current_sources,
  image_pipeline
) {
  //filter any null values
  image_pipeline = _.without(image_pipeline, null);

  //sort the pipeline
  image_pipeline = _.sortBy(image_pipeline, function(data_set) {
    return Constants.image_data_set_types[data_set._type].priority;
  });

  //check if the current image has a lower priority than the lowest in the pipeline (if so we shouldnt download anything)
  //check if the pipeline is empty.
  if (!image_pipeline || image_pipeline.length == 0) {
    console.info('EXITING IMAGE PROCESS PIPELINE, empty');
    return [];
  } else if (
    current_sources['image'] &&
    Constants.image_data_set_types[current_sources['image']].priority <
      Constants.image_data_set_types[image_pipeline[0]._type].priority
  ) {
    console.info(
      'EXITING IMAGE PROCESS PIPELINE, current image is lower priority',
      current_sources.image
    );

    return [];
  }

  //loop through the pipeline, and create  fallback-enabled wrapped promises t
  image_pipeline = image_pipeline.map(function(data_set) {
    if (data_set._type && data_set.url) {
      return function() {
        return PipelineImageService.generate_download_cover_promise(
          data_set.url,
          data_set._type
        );
      };
    } else if (data_set._type && data_set.promise) {
      return function() {
        console.info('downloading image via data promise');
        return data_set.promise;
      };
    } else if (data_set._type && data_set.identifier) {
      return function() {
        return q(data_set);
      };
    } else {
      return function() {
        return q.reject(new Error('invalid image data_set in pipeline'));
      };
    }
  });
  return image_pipeline;
};

PipelineImageService.generate_download_cover_promise = function(url, type) {
  if (type == 'goodreads' && url.indexOf('nophoto') != -1) {
    return q.reject('goodreads is returning an empty placeholder image.');
  }

  var deferred = q.defer();
  var request = require('request');
  console.info('downloading ' + type + ' image from: ' + url);
  request({ url: url, encoding: null }, function(error, response, body) {
    var content_type = response.headers['content-type'];
    var content_length = response.headers['content-length'];

    //amazon returns 200 even if the image is not found, so handle that case.
    if (
      type == 'amazon' &&
      content_type == 'image/gif' &&
      content_length < 45
    ) {
      deferred.reject(new Error('Amazon image not found.'));
    } else if (!error && response.statusCode == 200) {
      deferred.resolve({ data: body, headers: response.headers });
    } else {
      deferred.reject(
        error || new Error('statusCode was ' + response.statusCode)
      );
    }
  });
  return deferred.promise;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

PipelineImageService.generate_file_data_set = function(type, filepath) {
  function filepathPromise(local_filepath) {
    console.info('Loading image from filepath:', local_filepath);
    if (!local_filepath) {
      console.error('ERROR, no filepath specified for image. ');
      return q.reject(new Error('No filepath specified'));
    }
    if (!fs.existsSync(local_filepath)) {
      console.error('ERROR, file not found fo rimage.  ');
      return q.reject(new Error('File not found'));
    }
    return q.resolve({ data: fs.createReadStream(local_filepath) });
  }

  return {
    _type: type || 'file',
    promise: filepathPromise(filepath),
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// OpenLibrary Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
PipelineImageService.generate_openlibrary_data_set = function(isbn) {
  if (!isbn) {
    return null;
  }
  return {
    _type: 'openlibrary',
    url:
      'http://covers.openlibrary.org/b/isbn/' + isbn + '-L.jpg?default=false',
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Amazon Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
PipelineImageService.generate_amazon_data_set = function(isbn) {
  if (!isbn) {
    return null;
  }
  return {
    _type: 'amazon',
    url: 'http://images.amazon.com/images/P/' + isbn + '.01.LZZZZZZZ.jpg',
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Goodreads Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
PipelineImageService.generate_goodreads_data_set = function(url) {
  if (url.indexOf('nophoto') != -1) {
    return null;
  }
  return {
    _type: 'goodreads',
    url: url,
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Manual Data
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
PipelineImageService.generate_manual_data_set = function(identifier) {
  if (!identifier) {
    return null;
  }
  return {
    _type: 'manual',
    identifier: identifier,
  };
};
