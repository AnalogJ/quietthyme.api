var XMLSchema = require("xml-schema");
var schemas = require('../common/schemas');
var opdsSchema = new XMLSchema(schemas.FEED);

//private methods
function web_endpoint(){
    return 'https://' + (process.env.STAGE == 'master' ? 'www' : 'beta') + '.quietthyme.com'
}

function api_endpoint(){
    return 'https://api.quietthyme.com/'+process.env.STAGE + '/catalog'
}

function self_link(path){
    return {
        rel: 'self',
        href: api_endpoint + (path || ''),
        title: 'Current Page',
        type: 'application/atom+xml;profile=opds-catalog'
    };
}

//public methods

//BASE
function token_endpoint(token){
    return api_endpoint() + '/' + token
}
module.exports.token_endpoint = token_endpoint

//token is the catalog token
// id is required
// current_path is required (url after the catalog token in path.
module.exports.common_feed = function (token, id, current_path, next, page, limit ){
    var common =  {
        title: "QuietThyme - Home",
        authors: {
            name: "Jason Kulatunga",
            uri: web_endpoint(),
            email: "support@quietthyme.com"
        },
        icon: web_endpoint() + '/favicon.png',
        link: [
            {
                rel: "search",
                href: token_endpoint() + "/search_definition",
                type: "application/opensearchdescription+xml",
                title: "QuietThyme Catalog Search"
            },
            {
                rel: "alternate",
                href: web_endpoint(),
                type: "text/html",
                title: "HTML Page"
            },
            {
                rel: "start",
                href: token_endpoint(),
                type: "application/atom+xml;profile=opds-catalog",
                title: "Catalog Start Page"
            },
            //All catalogs should specify their current page.
            self_link(current_path)
        ]
    }

    if(next){
        common.link.push({
            rel: "next",
            type: "application/atom+xml;profile=opds-catalog;kind=acquisition",
            href: next,
            title: "Next Page"
        })
    }

    if(page != null && limit != null){
        common.itemsperpage = limit;
        common.startindex = (page * limit) + 1
    }
    return common
}



// Create an opds feed
module.exports.create_feed = function(feed) {
    return opdsSchema.generate(feed, {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: true,
        pretty: true
    });
}


