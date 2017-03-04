module.exports = {

    /*
     * Subset of service types related to storage.
     * */
    storage_types: ["google","dropbox","box","skydrive"],

    /*
     * List of extensions (including period) that can be stored/parsed by the application, listed in alphabetical order.
     * Formatted as follows
     * 'extension' => [String] the file extension in all lowercase
     * 'mimetype' => [String] the storage mimetype (used by the catalog system)
     * 'parse' => [Boolean] determines if the filetype can be parsed for additional metadata.
     * */
    file_extensions : {
        'azw3' : {
            extension : '.azw3',
            mimetype : 'application/vnd.amazon.ebook',
            parse :false
        },
        'azw' : {
            extension : '.azw',
            mimetype : 'application/vnd.amazon.ebook',
            parse :false
        },
        'cbr' : {
            extension : '.cbr',
            mimetype : 'application/x-cdisplay',
            parse :false
        },
        'cbt' : {
            extension : '.cbt',
            mimetype : 'application/x-cdisplay',
            parse :false
        },
        'cbz' : {
            extension : '.cbz',
            mimetype : 'application/x-cdisplay',
            parse :false
        },
        'chm' : {
            extension : '.chm',
            mimetype : 'application/x-chm',
            parse :false
        },
        'djvu' : {
            extension : '.djvu',
            mimetype : 'image/x-djvu',
            parse :false
        },
        'doc' : {
            extension : '.doc',
            mimetype : 'application/msword',
            parse :false
        },
        'docx' : {
            extension : '.docx',
            mimetype : 'application/vnd.openxmlformats',
            parse :false
        },
        'epub' : {
            extension : '.epub',
            mimetype : 'application/epub+zip',
            parse :false
        },
        'ibooks' : {
            extension : '.ibooks',
            mimetype : 'application/octet-stream',
            parse :false
        },
        'kf8' : {
            extension : '.kf8',
            mimetype : 'application/octet-stream',
            parse :false
        },
        'lrf' : {
            extension : '.lrf',
            mimetype : 'application/octet-stream',
            parse :false
        },
        'lit' : {
            extension : '.lit',
            mimetype : 'application/x-ms-reader',
            parse :false
        },
        'mobi' : {
            extension : '.mobi',
            mimetype : 'application/x-mobipocket-ebook',
            parse :false
        },
        'pdf' : {
            extension : '.pdf',
            mimetype : 'application/pdf',
            parse: true
        },
        'prc' : {
            extension : '.prc',
            mimetype : 'application/x-mobipocket-ebook',
            parse :false
        },
        'rtf' : {
            extension : '.rtf',
            mimetype : 'application/rtf',
            parse :false
        },
        'txt' : {
            extension : '.txt',
            mimetype : 'text/plain',
            parse :false
        }
    },
    image_extensions:{
        'jpg': {
            extension : '.jpg',
            mimetype : 'image/jpeg',
        },
        '.jpeg' : {
            extension : '.jpeg',
            mimetype : 'image/jpeg',
        },
        '.png' : {
            extension : '.png',
            mimetype : 'image/png',
        }
    },

    file_metadata :{
        '.opf' : {
            type : 'opf'
        },
        '.jpg' : {
            type:'image'
        },
        '.jpeg' : {
            type:'image'
        },
        '.png' : {
            type:'image'
        }
    }

}