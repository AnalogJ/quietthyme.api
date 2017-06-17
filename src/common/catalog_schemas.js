'use strict';
function ISODateString(d){
    if(typeof(d) == 'string'){
        d = new Date(d)
    }
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())+'Z'
}


var DATE = {
    transform: function(d) {
        return ISODateString(d);
    }
};

var ISBN = {
    tag: 'dcterms:identifier',
    attributes: {
        type: {
            name: 'xsi:type',
            default: 'dcterms:URI'
        }
    },
    transform: function(isbn) {
        return 'urn:ISBN:' + isbn;
    }
};

var AUTHOR = {
    tag: 'author',
    array: true,
    fields: {
        name: {},
        uri: {},
        email: {}
    },
    map: {
        to: 'name'
    }
};

var PRICE = {
    tag: 'opds:price',
    inner: 'value',
    attributes: {
        currency: {
            name: 'currencycode',
            default: 'USD'
        }
    },
    map: {
        to: 'value'
    }
};

var LINK = {
    tag: 'link',
    array: true,
    attributes: {
        href: {},
        rel: {},
        type: {},
        title: {}
    },
    fields: {
        price: PRICE,
        prices: PRICE
    },
    map: {
        href: 'name'
    }
};

var CATEGORY = {
    tag: 'category',
    array: true,
    attributes: {
        term: {},
        label: {},
        scheme: {
            default: "http://www.bisg.org/standards/bisac_subject/index.html"
        }
    }
};

var CONTENT = {
    tag: 'content',
    inner: 'value',
    raw: function() {
        return !!(this.value.type && this.value.type != 'text');
    },
    attributes: {
        type: {
            default: "text"
        }
    },
    map: {
        to: 'value'
    }
};

var ENTRY = {
    tag: 'entry',
    array: true,
    fields: {
        id: {},
        title: {},
        isbn: ISBN,
        updated: DATE,
        summary: {},
        links: LINK,
        authors: AUTHOR,
        categories: CATEGORY,
        issued: {
            tag: "dcterms:issued",
            transform: function(d) {
                return ISODateString(d);
            }
        },
        published: {
            transform: function(d) {
                return ISODateString(d);
            }
        },
        publisher: {
            tag: "dcterms:publisher"
        },
        language: {
            tag: "dcterms:language"
        },
        rights: {},
        //size: {}
        content: CONTENT
    }
};

var FULL_ENTRY = {
    tag: 'entry',
    attributes: {
        xmlns: {
            default: "http://www.w3.org/2005/Atom"
        },
        xmlnsdcterms: {
            name: "xmlns:dcterms",
            default: "http://purl.org/dc/terms/"
        },
        xmlnsopds: {
            name: "xmlns:opds",
            default: "http://opds-spec.org/2010/catalog"
        },

        xmlnsxsi: {
            name: "xmlns:xsi",
            default: "http://www.w3.org/2001/XMLSchema-instance"
        },
        xmlnsschema: {
            name: "xmlns:schema",
            default: "http://schema.org/"
        },
        xmlnsthr: {
            name: "xmlns:thr",
            default: "http://purl.org/syndication/thread/1.0"
        }
    },
    fields: {
        id: {},
        title: {},
        isbn: ISBN,
        updated: DATE,
        summary: {},
        links: LINK,
        authors: AUTHOR,
        categories: CATEGORY,
        issued: {
            tag: "dcterms:issued",
            transform: function(d) {
                return ISODateString(d);
            }
        },
        published: {
            transform: function(d) {
                return ISODateString(d);
            }
        },
        publisher: {
            tag: "dcterms:publisher"
        },
        language: {
            tag: "dcterms:language"
        },
        rights: {},
        //size: {}
        content: CONTENT
    }
};

var ITEMS_PER_PAGE = {
    tag: 'opensearch:itemsPerPage'
};

var START_INDEX = {
    tag: 'opensearch:startIndex'
};

var FEED = {
    tag: 'feed',
    attributes: {
        xmlns: {
            default: "http://www.w3.org/2005/Atom"
        },
        xmlnsdcterms: {
            name: "xmlns:dcterms",
            default: "http://purl.org/dc/terms/"
        },
        xmlnsopds: {
            name: "xmlns:opds",
            default: "http://opds-spec.org/2010/catalog"
        },
        xmlnsopensearch: {
            name: "xmlns:opensearch",
            default: "http://a9.com/-/spec/opensearch/1.1/"
        },
        xmlnsrelevance: {
            name: "xmlns:relevance",
            default: "http://a9.com/-/opensearch/extensions/relevance/1.0/"
        },
        xmlnsxsi: {
            name: "xmlns:xsi",
            default: "http://www.w3.org/2001/XMLSchema-instance"
        },
        xmlnsschema: {
            name: "xmlns:schema",
            default: "http://schema.org/"
        }
    },
    fields: {
        id: {},
        title: {},
        subtitle: {},
        icon: {},
        updated: DATE,
        links: LINK,
        authors: AUTHOR,
        entries: ENTRY,
        itemsperpage: ITEMS_PER_PAGE,
        startIndex: START_INDEX
    }
};


var SEARCH_DESCRIPTION = {
    tag: 'OpenSearchDescription',
    attributes: {
        xmlns: {
            default: "http://a9.com/-/spec/opensearch/1.1/"
        }
    },
    fields: {
        shortname: {
            tag: 'ShortName',
            default: 'QuietThyme'
        },
        description: {
            tag: 'Description',
            default: 'Search for e-books on QuietThyme'
        },
        inputencoding: {
            tag: 'InputEncoding',
            default: 'UTF-8'
        },
        outputencoding: {
            tag: 'OutputEncoding',
            default: 'UTF-8'
        },
        contact: {
            tag: 'Contact',
            default: 'support@quietthyme.com'
        },
        image: {
            tag: "Image",
            attributes: {
                type: {
                    default: "image/x-icon"
                },
                width: {
                    default: '16'
                },
                height:{
                    default: '16'
                }
            },
            default: ''
        },
        url: {
            tag: "Url",
            attributes: {
                type: {
                    default: "application/atom+xml"
                },
                template: {}
            }
        },
        query: {
            tag: "Query",
            attributes: {
                role: {
                    default: "example"
                },
                searchTerms: {
                    default: "robot"
                }
            },
            default: {}
        }
    }
};


module.exports = {
    FEED: FEED,
    SEARCH_DESCRIPTION: SEARCH_DESCRIPTION,
    FULL_ENTRY: FULL_ENTRY
};