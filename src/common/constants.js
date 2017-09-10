'use strict';
var nconf = require('./nconf');
module.exports = {
  deploy_sha: nconf.get('DEPLOY_SHA'),
  web_domain: `${nconf.get('STAGE') == 'master'
    ? 'www'
    : 'beta'}.quietthyme.com`,
  tables: {
    users: 'quietthyme-api-' + nconf.get('STAGE') + '-users',
    credentials: 'quietthyme-api-' + nconf.get('STAGE') + '-credentials',
    books: 'quietthyme-api-' + nconf.get('STAGE') + '-books',
  },
  buckets: {
    // content bucket contains thumbnails and files that will be served directly from S3.
    content: 'quietthyme-api-' + nconf.get('STAGE') + '-content',

    // upload bucket contains files that are temporarily located in S3, and will need to be processed, ie:
    // - files manually uploaded via WebUI
    // - files uploaded by Calibre client
    upload: 'quietthyme-api-' + nconf.get('STAGE') + '-upload',
  },

  /*
     * Subset of service types related to storage.
     * */
  storage_types: ['gdrive', 'dropbox', 'box', 'skydrive'],

  /*
     * List of extensions (including period) that can be stored/parsed by the application, listed in alphabetical order.
     * Formatted as follows
     * 'extension' => [String] the file extension in all lowercase
     * 'mimetype' => [String] the storage mimetype (used by the catalog system)
     * 'parse' => [Boolean] determines if the filetype can be parsed for additional metadata.
     * */
  file_extensions: {
    azw3: {
      extension: '.azw3',
      mimetype: 'application/vnd.amazon.ebook',
      parse: false,
    },
    azw: {
      extension: '.azw',
      mimetype: 'application/vnd.amazon.ebook',
      parse: false,
    },
    cbr: {
      extension: '.cbr',
      mimetype: 'application/x-cdisplay',
      parse: false,
    },
    cbt: {
      extension: '.cbt',
      mimetype: 'application/x-cdisplay',
      parse: false,
    },
    cbz: {
      extension: '.cbz',
      mimetype: 'application/x-cdisplay',
      parse: false,
    },
    chm: {
      extension: '.chm',
      mimetype: 'application/x-chm',
      parse: false,
    },
    djvu: {
      extension: '.djvu',
      mimetype: 'image/x-djvu',
      parse: false,
    },
    doc: {
      extension: '.doc',
      mimetype: 'application/msword',
      parse: false,
    },
    docx: {
      extension: '.docx',
      mimetype: 'application/vnd.openxmlformats',
      parse: false,
    },
    epub: {
      extension: '.epub',
      mimetype: 'application/epub+zip',
      parse: false,
    },
    ibooks: {
      extension: '.ibooks',
      mimetype: 'application/octet-stream',
      parse: false,
    },
    kf8: {
      extension: '.kf8',
      mimetype: 'application/octet-stream',
      parse: false,
    },
    lrf: {
      extension: '.lrf',
      mimetype: 'application/octet-stream',
      parse: false,
    },
    lit: {
      extension: '.lit',
      mimetype: 'application/x-ms-reader',
      parse: false,
    },
    mobi: {
      extension: '.mobi',
      mimetype: 'application/x-mobipocket-ebook',
      parse: false,
    },
    pdf: {
      extension: '.pdf',
      mimetype: 'application/pdf',
      parse: true,
    },
    prc: {
      extension: '.prc',
      mimetype: 'application/x-mobipocket-ebook',
      parse: false,
    },
    rtf: {
      extension: '.rtf',
      mimetype: 'application/rtf',
      parse: false,
    },
    txt: {
      extension: '.txt',
      mimetype: 'text/plain',
      parse: false,
    },
  },
  image_extensions: {
    jpg: {
      extension: '.jpg',
      mimetype: 'image/jpeg',
    },
    '.jpeg': {
      extension: '.jpeg',
      mimetype: 'image/jpeg',
    },
    '.png': {
      extension: '.png',
      mimetype: 'image/png',
    },
  },

  file_metadata: {
    '.opf': {
      type: 'opf',
    },
    '.jpg': {
      type: 'image',
    },
    '.jpeg': {
      type: 'image',
    },
    '.png': {
      type: 'image',
    },
  },

  //metadata priority orders, (lower is better) (0 means the data will never be overridden)
  metadata_data_set_types: {
    manual: {
      priority: 0,
    },
    calibre: {
      //data retrieved from calibre database via plugin, (which in some cases is the opf file)
      priority: 1,
    },
    api: {
      //data retrieved from calibre database via plugin, (which in some cases is the opf file)
      priority: 1,
    },
    goodreads: {
      priority: 2,
    },
    amazon: {
      priority: 2,
    },
    google: {
      priority: 2,
    },
    //other sources, barnesandnoble, fanfiction, ect go here, priority 2 (book was found via an Identifier)
    opf: {
      priority: 3,
    },
    embedded: {
      //data retrieved from embedded book metadata (eg. book spines, pdf attributes)'
      priority: 4,
    },
    file: {
      //data retrieved from the filename.
      priority: 5,
    },
  },
  image_data_set_types: {
    manual: {
      priority: 0,
    },
    file: {
      priority: 1,
    },
    calibre: {
      priority: 1,
    },
    api: {
      priority: 2,
    },
    goodreads: {
      priority: 2,
    },
    amazon: {
      priority: 3,
    },
    openlibrary: {
      priority: 4,
    },
    embedded: {
      priority: 5,
    },
  },
};
