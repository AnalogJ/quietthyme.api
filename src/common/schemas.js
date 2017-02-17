var DATE = {
    transform: function(d) {
        return (new Date(d)).toISOString();
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
        rel: {
            transform: function(v) {
                return "http://opds-spec.org/"+v;
            }
        },
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
        code: {
            name: 'term'
        },
        label: {},
        scheme: {
            default: "http://www.bisg.org/standards/bisac_subject/index.html"
        }
    },
    map: {
        to: 'code'
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
        updated: DATE,
        summary: {},
        links: LINK,
        authors: AUTHOR,
        categories: CATEGORY,
        issued: {
            tag: "dc:issued",
            transform: function(d) {
                return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
            }
        },
        publisher: {
            tag: "dc:publisher"
        },
        language: {
            tag: "dc:language"
        },
        rights: {},
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

module.exports = {
    FEED: FEED
};