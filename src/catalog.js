require('dotenv').config();
var CatalogService = require('./services/CatalogService'),
    DBService = require('./services/DBService'),
    Helpers = require('./common/helpers')
    Base64Service = require('./services/Base64Service'),
    Constants = require('./common/constants'),
    q = require('q');


var QUERY_LIMIT = 50;
module.exports = {
    index: function (event, context, cb) {

        CatalogService.findUserByToken(event.path.catalogToken)
            .spread(function(user, db_client){

                //user was found.
                var id = 'root'
                var token = user.catalog_token
                var opds_catalog = CatalogService.navigation_feed(token, id);
                opds_catalog.entries = [
                    {
                        updated: '2014-05-07T15:45:36Z',
                        id: id + ':recent',
                        title: 'Recently Added',
                        content: 'Recently added books.',
                        links: [
                            {
                                type: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
                                rel: 'http://opds-spec.org/featured',
                                href: CatalogService.token_endpoint(token) + '/recent'
                            },
                            {
                                type: 'image/png',
                                rel: 'image/thumbnail',
                                href: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAS4SURBVHjaYvz//z8DLQBAADEx0AgABABZAKb/AWYuLgAAAAAA+QEBAPoAACcE9fVaGwAAQhMBASUA/f0C8Pv74c7+/sTxDw+mHQYGGBXy8lcY/f01CQUFFPkAAPLj/f3Ux/LytOD4+KwPBwft+fr6AOn09AACCGzwP6ChP75/j9NiY2t0d3FRULa0ZOAREADa9pPh++3bDA83b2bYe+XKBzF2dm5rFxdWcRcXBmYREYZ/wGB8/fgxw7XduxmWnDhx4uC3b4Vff/488ebrVwaAAGJM19Ji+PbjR4aXouK0kNJSRhZ9fYhfYGHPwsLA8PYtA8PSpQwMKioMDG5uDAxMwBD89w8amED2t28Mr9atY+ibPv3FvGfPwl5//34YIICY9QQEdC14eBbHlZdzMSsqMjC8eMHA8P49BH/4wMDw7h0Dw+/fDAyGhgwMEhIMDG/eQMRg8p8+gc3nNjVlMGBk5Ll88aLOzW/fNgIEEAv3t28pHm5uQkwgr9+5w8AADBasAOYDmDwrKwMDGxvDv9evGb5dvMjw9ckTBhFg+Mbz85se/fIlCiCAWOSZmJxkhYUZGJ4/Z2D48YOI6AYazMXF8O/pU4Yf+/czfAbibyDDgVKgwDGUlWWQZGe3BAggFj4GBmlmYGCDwxFoI07XggwEuhAUtn/27mX4vmsXw4+XLxn+QtMsCyhlAeODFxjmvP//8wMEEMufv38//XvyRJCJnx+cCrAaCopAoKH/gUH1C2jor5s3Gf4gK4G6lpmZmeEPMIh+/f3LABBALPf//j376fZteQEhIZAMIrZh3gYq/P/9O8OvK1cY/pw7x/AXyAap+IuGQRYJ8vExXAfqefHr12uAAGIGev6PHiNjuAIwfEHpmfHPH0iQAPF/YDL6BUzHXw4cALvyL1AO3TAQ/R2IeYDhLgwM36kfPnzf+fHjXIAAYv7679/9T//+aQCTipYwMKx/A4PjFzAZfX/0iOHjpUsMn69eZfiD5so/UPwbaigvLy+DjLIywwZgjut++XLn+79/JwIEEPOv////3P316/CzX790FdjYVKSAYfr8+nWGV0CD/4IiFRp+/9BcCTIUFCNikpIMogoKDCuB6brx6dNjd3//bgIKXwIIIGZWiOIvl3792nLjyxdhMVZWY0N5eYa/QJd//vYNbjByEIDSzl9g7MsCcyKTuDjDxIcPf7c8f77xwd+/1UCp4yA9AAEEii4GZmDYAjX8eP3v345Lnz59Yf/718pcVZWNAxhxb4Au+YtkOCils3ByMqgCy5gX7OwMTdevv5/24cNcYF5sBkpdhcU7QAAxgFzMDs1NIkBX8ABpKQaGwFYBgWevra3/fzA0/H+Kmfk/0Bn/jwHxDWHh/38cHP4f19L6783M/BCoPA+IBdBTKUAAYRgsAmUDVRqnsbGduGlq+v+rjc3/03x8/+8qKPz/4eLyf6Ws7H9gyXESqCwYiNmw5SmAAMJqMKy0AGYZST9GxmXHNDX///X1/f/Byel/j4DAXxkGhjVAaVN8OR8ggHAaDAp7YVAeYWDgsAaG3zwxsfcFXFxvgUVAL1BYnlCRAhBAeA0WRfInLwODOzBjh4KUEVM1AQQQI60qU4AAAwBnu/BQIoGoSgAAAABJRU5ErkJggg=="
                            }
                        ]
                    },
                    {
                        updated: '2014-05-07T15:45:36Z',
                        id: id + ':all',
                        title: 'All Books',
                        content: 'All books, ordered by Title.',
                        links: [
                            {
                                type: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
                                rel: 'http://opds-spec.org/featured',
                                href: CatalogService.token_endpoint(token) + '/books'
                            },
                            {
                                type: 'image/png',
                                rel: 'image/thumbnail',
                                href: "data:image/png;base64,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"
                            }
                        ]
                    },
                    {
                        updated: '2014-05-07T15:45:36Z',
                        id: id + ':authors',
                        title: 'Authors',
                        content: 'Authors, listed alphabetically.',
                        links: [
                            {
                                type: 'application/atom+xml;profile=opds-catalog;kind=navigation',
                                rel: 'http://opds-spec.org/featured',
                                href: CatalogService.token_endpoint(token) + '/authors'
                            },
                            {
                                type: 'image/png',
                                rel: 'image/thumbnail',
                                href: "data:image/png;base64,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"
                            }
                        ]
                    },
                    {
                        updated: '2014-05-07T15:45:36Z',
                        id: id + ':series',
                        title: 'Series',
                        content: 'Series names, listed alphabetically.',
                        links: [
                            {
                                type: 'application/atom+xml;profile=opds-catalog;kind=navigation',
                                rel: 'http://opds-spec.org/featured',
                                href: CatalogService.token_endpoint(token) + '/series'
                            },
                            {
                                type: 'image/png',
                                rel: 'image/thumbnail',
                                href: "data:image/png;base64,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"
                            }
                        ]
                    },
                    {
                        updated: '2014-05-07T15:45:36Z',
                        id: id + ':about',
                        title: 'About QuietThyme',
                        content: 'QuietThyme Web',
                        links: [
                            {
                                type: 'application/atom+xml;profile=opds-catalog;kind=acquisition',
                                href: 'http://www.quietthyme.com'
                            },
                            {
                                type: 'image/png',
                                rel: 'image/thumbnail',
                                href: "data:image/png;base64,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"
                            }
                        ]
                    }
                ]
                return CatalogService.toXML(opds_catalog);
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    // # /catalog/{{token}}/series/{{page}} -- alphabetical list of series names.
    series: function (event, context, cb) {
        var token = event.path.catalogToken;
        var page = (event.query.page | 0);
        var path = "/series" + CatalogService.page_suffix(page)


        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var series_query = CatalogService.generatePaginatedSeriesQuery(db_client, user.uid, QUERY_LIMIT, page);
                series_query.orderBy('series_name');
                return q.all([user, series_query]);
            })

            .spread(function (user, series_list) {
                if (!series_list.length) {
                    return q.reject(new Error("No Series found"))
                }

                //user was found.
                var id = 'root:' + token + ':series'
                var next_path = null;
                if (series_list.length >= QUERY_LIMIT) {
                    next_path = "/series?page=" + (page + 1);
                }

                var opds_catalog = CatalogService.acquisition_feed(token, id, path, next_path, page, QUERY_LIMIT);
                opds_catalog.entries = series_list.map(function(series){
                    return CatalogService.seriesToPartialEntry(id, token, series.series_name)
                })
                return CatalogService.toXML(opds_catalog);


            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()



       // //TODO: do a custom query here, all the books on this shelf, and for each book, select the series. for each series
       //
       // function querySeries(user) {
       //     var deferred = q.defer()
       //     Book.query("SELECT DISTINCT series_name " +
       //         "FROM book " +
       //         "WHERE owner = $1 AND series_name IS NOT NULL " +
       //         "ORDER BY series_name ASC " +
       //         "LIMIT $2 " +
       //         "OFFSET $3 ", [user.id, limit, limit * page],
       //         function (error, data) {
       //             if (error) {
       //                 deferred.reject(error)
       //             }
       //             else {
       //                 deferred.resolve(data.rows);//resolved successfully.
       //             }
       //         })
       //     return deferred.promise;
       // }
       //
       // var token = req.params.token.trim()
       // var page = (req.params.page | 0);
       //
       // return findUserByCatalogToken(token)
       //     .then(function (user) {
       //         if (!user) {
       //             return q.reject(new Error("No User found"));
       //         }
       //
       //         var book_query = generatePaginatedBookQuery(user, limit, page);
       //         book_query.ascending("title")
       //         return q.all([user, book_query.find({useMasterKey: true})]);
       //     })
       //
       // return findUserByCatalogToken(token)
       //     .then(function (user) {
       //         if (!user) {
       //             return q.reject(new Error("No User found"));
       //         }
       //         return querySeries(user)
       //             .then(function (series) {
       //
       //
       //                 if (!series.length) {
       //                     return q.reject(new Error("No Books found"))
       //                 }
       //                 //root catalog parameters
       //                 var params = common_params(token);
       //                 params.id = "root:" + token + ":series";
       //                 params.title = "Series"
       //                 params.series = series;
       //                 params.updated = user.updatedAt;
       //                 params.self = params.base + "/series/" + (page || "")
       //                 params.page = page;
       //                 if (series.length >= limit) {
       //                     params.next = params.base + "/series/" + (page + 1);
       //                 }
       //
       //                 //catalog root;
       //                 res.setHeader("Content-Type", "application/xml");
       //                 res.view(params);
       //             })
       //     })


       // list the series name here., sorted and paginated.

       //catalog root;

    },

    //# /catalog/{{token}}/authors/{{page}} -- alphabetical list of authors
    //authors: function (req, res) {
    //    var token = req.params.token.trim()
    //    var page = (req.params.page | 0);
    //
    //    //root catalog parameters
    //    var params = common_params(req.params.token);
    //    params.id = "root:authors";
    //    params.self = params.base + "/authors/" + (req.params.page || "");
    //    //TODO: do a custom query here, all the books on this shelf, and for each book, select the author. for each author
    //    // list the author name here., sorted and paginated.
    //
    //    function queryAuthors(user) {
    //        var deferred = q.defer()
    //        Author.query("SELECT DISTINCT author.id, author.name FROM author " +
    //            "JOIN author_books__book_authors AS book_authors " +
    //            "ON author.id = book_authors.author_books " +
    //            "JOIN book " +
    //            "ON book_authors.book_authors = book.id AND book.owner = $1 " +
    //            "ORDER BY name ASC " +
    //            "LIMIT $2 " +
    //            "OFFSET $3 ", [user.id, limit, limit * page],
    //            function (error, data) {
    //                if (error) {
    //                    deferred.reject(error)
    //                }
    //                else {
    //                    deferred.resolve(data.rows);//resolved successfully.
    //                }
    //            })
    //        return deferred.promise;
    //    }
    //
    //    return findUserByCatalogToken(tokentoken)
    //        .then(function (user) {
    //            if (!user) {
    //                return q.reject(new Error("No User found"));
    //            }
    //            return queryAuthors(user)
    //                .then(function (authors) {
    //                    if (!authors.length) {
    //                        return q.reject(new Error("No Authors found"))
    //                    }
    //                    //root catalog parameters
    //                    var params = common_params(token);
    //                    params.id = "root:" + token + ":authors";
    //                    params.title = "Authors"
    //                    params.authors = authors;
    //                    params.updated = user.updatedAt;
    //                    params.self = params.base + "/authors/" + (page || "")
    //                    params.page = page;
    //                    if (authors.length >= limit) {
    //                        params.next = params.base + "/authors/" + (page + 1);
    //                    }
    //
    //                    //catalog root;
    //                    res.setHeader("Content-Type", "application/xml");
    //                    res.view(params);
    //                })
    //        })
    //},

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // #Acquisition Feeds
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //#  /catalog/{{token}}/books/{{page}} -- alphabetical list of books
    books: function (event, context, cb) {
        var token = event.path.catalogToken;
        var page = (event.query.page | 0);
        var path = "/books" + + CatalogService.page_suffix(page)

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = CatalogService.generatePaginatedBookQuery(db_client, user.uid, QUERY_LIMIT, page);
                book_query.orderBy("title")
                return q.all([user, book_query]);
            })
            .spread(function (user, books) {
                if (!books.length) {
                    return q.reject(new Error("No Books found"))
                }

                //user was found.
                var id = 'root:' + token + ':books'
                var next_path = null;
                if (books.length >= QUERY_LIMIT) {
                    next_path = "/books" + + CatalogService.page_suffix(page + 1);
                }

                var opds_catalog = CatalogService.acquisition_feed(token, id, path, next_path, page, QUERY_LIMIT);
                opds_catalog.entries = books.map(function(book){
                    return CatalogService.bookToPartialEntry(id, token, book)
                })
                return CatalogService.toXML(opds_catalog);


            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },
    //# /catalog/{{token}}/search?q={{search_term}} -- search

    //# /catalog/{{token}}/recent/ -- recently added books
    recent: function (event, context, cb) {
        var token = event.path.catalogToken;
        var path = "/recent/"

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = CatalogService.generatePaginatedBookQuery(db_client, user.uid);
                book_query.orderBy("created_at", 'desc')
                return q.all([user, book_query]);
            })
            .spread(function (user, books) {
                if (!books.length) {
                    return q.reject(new Error("No Books found"))
                }

                //user was found.
                var id = 'root:' + token + ':recent';
                var opds_catalog = CatalogService.acquisition_feed(token, id, path);
                opds_catalog.title = 'QuietThyme - Recent'
                opds_catalog.entries = books.map(function(book){
                    return CatalogService.bookToPartialEntry(id, token, book)
                })
                return CatalogService.toXML(opds_catalog);
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    //# /catalog/{{token}}/in_series/{{seriesId}}/{{page}} -- list of all books for a series_id
    seriesid: function (event, context, cb) {
        var token = event.path.catalogToken;
        var encoded_series_id = event.path.seriesId
        var page = (event.query.page | 0);
        var path = "/in_series/" + encoded_series_id + CatalogService.page_suffix(page)

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = CatalogService.generatePaginatedBookQuery(db_client, user.uid, QUERY_LIMIT, page);
                book_query.where({series_name: Base64Service.urlDecode(encoded_series_id)})
                book_query.orderBy("title")
                return q.all([user, book_query]);
            })
            .spread(function (user, books) {
                if (!books.length) {
                    return q.reject(new Error("No Books found"))
                }

                //user was found.
                var id = 'root:' + token + ':in_series:' + encoded_series_id;
                var next_path = null;
                if (books.length >= QUERY_LIMIT) {
                    next_path = "/in_series/" + encoded_series_id + + CatalogService.page_suffix(page + 1)
                }

                var opds_catalog = CatalogService.acquisition_feed(token, id, path, next_path, page, QUERY_LIMIT);
                opds_catalog.title = 'QuietThyme - In Series';
                opds_catalog.entries = books.map(function(book){
                    return CatalogService.bookToPartialEntry(id, token, book)
                })
                return CatalogService.toXML(opds_catalog);


            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    //# /catalog/{{token}}/by_author/{{authorId}}/{{page}} -- list of all books for a author_id
    authorid: function (event, context, cb) {
        var token = event.path.catalogToken;
        var encoded_author_id = event.path.authorId
        var page = (event.query.page | 0);
        var path = "/by_author/" + encoded_author_id + CatalogService.page_suffix(page)

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = CatalogService.generatePaginatedBookQuery(db_client, user.uid, QUERY_LIMIT, page);
                book_query.where('authors', '@>', Base64Service.urlDecode(encoded_author_id))
                book_query.orderBy("title")
                return q.all([user, book_query]);
            })
            .spread(function (user, books) {
                if (!books.length) {
                    return q.reject(new Error("No Books found"))
                }

                //user was found.
                var id = 'root:' + token + ':by_author:' + encoded_author_id;
                var next_path = null;
                if (books.length >= QUERY_LIMIT) {
                    next_path = "/by_author/" + encoded_author_id + CatalogService.page_suffix(page + 1)
                }

                var opds_catalog = CatalogService.acquisition_feed(token, id, path, next_path, page, QUERY_LIMIT);
                opds_catalog.title = 'QuietThyme - By Author';
                opds_catalog.entries = books.map(function(book){
                    return CatalogService.bookToPartialEntry(id, token, book)
                })
                return CatalogService.toXML(opds_catalog);


            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    //# /catalog/{{token}}/tagged_with/{{tagName}}/page? -- list of all books tagged with a tag.,
    tagname: function (event, context, cb) {
        var token = event.path.catalogToken;
        var encoded_tag_name = event.path.tagName
        var page = (event.query.page | 0);
        var path = "/tagged_with/" + encoded_tag_name + CatalogService.page_suffix(page)

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = CatalogService.generatePaginatedBookQuery(db_client, user.uid, QUERY_LIMIT, page);
                book_query.where('tags', '@>', Base64Service.urlDecode(encoded_tag_name))
                book_query.orderBy("title")
                return q.all([user, book_query]);
            })
            .spread(function (user, books) {
                if (!books.length) {
                    return q.reject(new Error("No Books found"))
                }

                //user was found.
                var id = 'root:' + token + ':tagged_with:' + encoded_tag_name;
                var next_path = null;
                if (books.length >= QUERY_LIMIT) {
                    next_path = "/tagged_with/" + encoded_tag_name + CatalogService.page_suffix(page + 1)
                }

                var opds_catalog = CatalogService.acquisition_feed(token, id, path, next_path, page, QUERY_LIMIT);
                opds_catalog.title = 'QuietThyme - Tagged With';
                opds_catalog.entries = books.map(function(book){
                    return CatalogService.bookToPartialEntry(id, token, book)
                })
                return CatalogService.toXML(opds_catalog);
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    //# /catalog/{{token}}/search_definition -- the search definition for this catalog.. specifies the format and url for searches
    search_definition: function (event, context, cb)  {
        var token = event.path.catalogToken;

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }
                return user
            })
            .then(function (user) {

                return CatalogService.toXML(CatalogService.search_description_feed(token),'SEARCH_DESCRIPTION')

            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    //# /catalog/{{token}}/search?page={{page}}&query={{seach_term}} -- list of all books tagged with a tag.,
    search: function (event, context, cb) {
        var token = event.path.catalogToken;
        var query = event.query.query
        var page = (event.query.page | 0);
        var path = "/search?query=" + encodeURIComponent(query) + "&page=" + page

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = CatalogService.generatePaginatedBookQuery(db_client, user.uid, QUERY_LIMIT, page);
                book_query.where('title', 'like', query)
                book_query.orderBy("title")
                return q.all([user, book_query]);
            })
            .spread(function (user, books) {
                if (!books.length) {
                    return q.reject(new Error("No Books found"))
                }

                //user was found.
                var id = 'root:' + token + ':search';
                var next_path = null;
                if (books.length >= QUERY_LIMIT) {
                    next_path = "/search?query=" + encodeURIComponent(query) + "&page=" + (page + 1);
                }

                var opds_catalog = CatalogService.acquisition_feed(token, id, path, next_path, page, QUERY_LIMIT);
                opds_catalog.title = 'QuietThyme - Search Results';
                opds_catalog.entries = books.map(function(book){
                    return CatalogService.bookToPartialEntry(id, token, book)
                })
                return CatalogService.toXML(opds_catalog);
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    },

    //#  /catalog/{{catalogToken}}/book/{{bookId}} -- book details for a book_id
    book: function (event, context, cb) {
        console.dir(event)
        var bookId = event.path.bookId;
        var token = event.path.catalogToken;
        var path = "/book/" + bookId

        return CatalogService.findUserByToken(token)
            .spread(function(user, db_client){
                if (!user) {
                    return q.reject(new Error("No User found"));
                }

                var book_query = db_client.first()
                    .from('books')
                    .where({user_id: user.uid, id: bookId});
                return q.all([user, book_query]);
            })
            .spread(function (user, book) {
                if (!book) {
                    return q.reject(new Error("No Book found"))
                }

                //user was found.
                var id = 'root:' + token + ':book';

                var opds_entry = CatalogService.bookToFullEntry(id,token, book, path);


                return CatalogService.toXML(opds_entry, 'FULL_ENTRY');
            })
            .then(Helpers.successHandler(cb))
            .fail(Helpers.errorHandler(cb))
            .done()
    }

}