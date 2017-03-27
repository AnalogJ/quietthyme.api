var should = require('should');
var ParseExternalService = require('../../src/services/ParseExternalService')
//this is just simple integration testing
describe('ParseExternalService', function () {

    describe('#parse_goodreads_book_details()', function () {
        var goodreads_book_basic;

        before(function () {
            goodreads_book_basic = {
                "GoodreadsResponse": {
                    "Request": [
                        {
                            "authentication": [
                                "true"
                            ],
                            "key": [
                                "VEjXc5XWMAeIJYoHlqZK8w"
                            ],
                            "method": [
                                "book_show"
                            ]
                        }
                    ],
                    "book": [
                        {
                            "id": [
                                "11045423"
                            ],
                            "title": [
                                "Scholar (Imager Portfolio, #4)"
                            ],
                            "isbn": [
                                ""
                            ],
                            "isbn13": [
                                "9780765329554"
                            ],
                            "asin": [
                                ""
                            ],
                            "image_url": [
                                "https://d.gr-assets.com/books/1316731170m/11045423.jpg"
                            ],
                            "small_image_url": [
                                "https://d.gr-assets.com/books/1316731170s/11045423.jpg"
                            ],
                            "publication_year": [
                                "2011"
                            ],
                            "publication_month": [
                                "11"
                            ],
                            "publication_day": [
                                "8"
                            ],
                            "publisher": [
                                "Tor Books"
                            ],
                            "language_code": [
                                "eng"
                            ],
                            "is_ebook": [
                                "false"
                            ],
                            "description": [
                                "Hundreds of years before the time of Imager, the continent of Lydar is fragmented.  Years of war have consolidated five nations into three — Bovaria, Telaryn, and Antiago. Quaeryt is a scholar and a friend of Bhayar, the young ruler of Telaryn. Worried about his future and the escalating intrigues in Solis, the capital city, Quaeryt persuades Bhayar to send him to Tilbor, conquered ten years earlier by Bhayar’s father, in order to see if the number and extent of occupying troops can be reduced so that they can be re-deployed to the border with warlike Bovaria.<br><br>Quaeryt has managed to conceal the fact that he is an imager, since the life expectancies of imagers in Lydar is short. Just before Quaeryt departs, Bhayar’s youngest sister passes a letter to the scholar-imager, a letter that could well embroil Quaeryt in the welter of court politics he had hoped to leave behind. On top of that, on his voyage and journey to Tilbor he must face pirates, storms, poisonings, attempted murder, as well as discovering the fact that he is not quite who he thought he was. To make it all worse, the order of scholars to which he belongs is jeopardized in more ways than one."
                            ],
                            "work": [
                                {
                                    "best_book_id": [
                                        {
                                            "_": "11045423",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "books_count": [
                                        {
                                            "_": "10",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "default_chaptering_book_id": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "default_description_language_code": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "desc_user_id": [
                                        {
                                            "_": "3906245",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "id": [
                                        {
                                            "_": "15966126",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "media_type": [
                                        "book"
                                    ],
                                    "original_language_id": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "original_publication_day": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "original_publication_month": [
                                        {
                                            "_": "11",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "original_publication_year": [
                                        {
                                            "_": "2011",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "original_title": [
                                        "Scholar (Imager Portfolio, #4)"
                                    ],
                                    "rating_dist": [
                                        "4:112|5:85|3:50|1:2|2:7|total:256"
                                    ],
                                    "ratings_count": [
                                        {
                                            "_": "1382",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "ratings_sum": [
                                        {
                                            "_": "5624",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "reviews_count": [
                                        {
                                            "_": "2105",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "text_reviews_count": [
                                        {
                                            "_": "90",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ]
                                }
                            ],
                            "average_rating": [
                                "4.07"
                            ],
                            "num_pages": [
                                "508"
                            ],
                            "format": [
                                "Hardcover"
                            ],
                            "edition_information": [
                                ""
                            ],
                            "ratings_count": [
                                "1222"
                            ],
                            "text_reviews_count": [
                                "78"
                            ],
                            "url": [
                                "https://www.goodreads.com/book/show/11045423-scholar"
                            ],
                            "link": [
                                "https://www.goodreads.com/book/show/11045423-scholar"
                            ],
                            "authors": [
                                {
                                    "author": [
                                        {
                                            "id": [
                                                "1301649"
                                            ],
                                            "name": [
                                                "L.E. Modesitt Jr."
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/authors/1207333645p5/1301649.jpg"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/authors/1207333645p2/1301649.jpg"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/author/show/1301649.L_E_Modesitt_Jr_"
                                            ],
                                            "average_rating": [
                                                "3.92"
                                            ],
                                            "ratings_count": [
                                                "104731"
                                            ],
                                            "text_reviews_count": [
                                                "2552"
                                            ]
                                        }
                                    ]
                                }
                            ],
                            "reviews_widget": [
                                "\n      \n        <style>\n  #goodreads-widget {\n    font-family: georgia, serif;\n    padding: 18px 0;\n    width:565px;\n  }\n  #goodreads-widget h1 {\n    font-weight:normal;\n    font-size: 16px;\n    border-bottom: 1px solid #BBB596;\n    margin-bottom: 0;\n  }\n  #goodreads-widget a {\n    text-decoration: none;\n    color:#660;\n  }\n  iframe{\n    background-color: #fff;\n  }\n  #goodreads-widget a:hover { text-decoration: underline; }\n  #goodreads-widget a:active {\n    color:#660;\n  }\n  #gr_footer {\n    width: 100%;\n    border-top: 1px solid #BBB596;\n    text-align: right;\n  }\n  #goodreads-widget .gr_branding{\n    color: #382110;\n    font-size: 11px;\n    text-decoration: none;\n    font-family: verdana, arial, helvetica, sans-serif;\n  }\n</style>\n<div id=\"goodreads-widget\">\n  <div id=\"gr_header\"><h1><a href=\"https://www.goodreads.com/book/show/11045423-scholar\">Scholar Reviews</a></h1></div>\n  <iframe id=\"the_iframe\" src=\"https://www.goodreads.com/api/reviews_widget_iframe?did=DEVELOPER_ID&amp;format=html&amp;isbn=9780765329554&amp;links=660&amp;min_rating=&amp;review_back=fff&amp;stars=000&amp;text=000\" width=\"565\" height=\"400\" frameborder=\"0\"></iframe>\n  <div id=\"gr_footer\">\n    <a href=\"https://www.goodreads.com/book/show/11045423-scholar?utm_medium=api&amp;utm_source=reviews_widget\" class=\"gr_branding\" target=\"_blank\">Reviews from Goodreads.com</a>\n  </div>\n</div>\n\n      \n    "
                            ],
                            "popular_shelves": [
                                {
                                    "shelf": [
                                        {
                                            "$": {
                                                "name": "to-read",
                                                "count": "339"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "fantasy",
                                                "count": "135"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "currently-reading",
                                                "count": "13"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "fiction",
                                                "count": "10"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "epic-fantasy",
                                                "count": "9"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "favorites",
                                                "count": "7"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "modesitt",
                                                "count": "6"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "imager-portfolio",
                                                "count": "5"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "default",
                                                "count": "5"
                                            }
                                        },
                                        {
                                            "$": {
                                                "name": "library",
                                                "count": "5"
                                            }
                                        }
                                    ]
                                }
                            ],
                            "book_links": [
                                {
                                    "book_link": [
                                        {
                                            "id": [
                                                "3"
                                            ],
                                            "name": [
                                                "Barnes & Noble"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/3"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "10"
                                            ],
                                            "name": [
                                                "Audible"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/10"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "4"
                                            ],
                                            "name": [
                                                "Abebooks"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/4"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "882"
                                            ],
                                            "name": [
                                                "Book Depository"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/882"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "1027"
                                            ],
                                            "name": [
                                                "Kobo"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/1027"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "9"
                                            ],
                                            "name": [
                                                "Indigo"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/9"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "2"
                                            ],
                                            "name": [
                                                "Half.com"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/2"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "5"
                                            ],
                                            "name": [
                                                "Alibris"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/5"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "2102"
                                            ],
                                            "name": [
                                                "iBooks"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/2102"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "107"
                                            ],
                                            "name": [
                                                "Better World Books"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/107"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "3928"
                                            ],
                                            "name": [
                                                "Target.com"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/3928"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "1602"
                                            ],
                                            "name": [
                                                "Google Play"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/1602"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "7"
                                            ],
                                            "name": [
                                                "IndieBound"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/7"
                                            ]
                                        },
                                        {
                                            "id": [
                                                "8"
                                            ],
                                            "name": [
                                                "Libraries"
                                            ],
                                            "link": [
                                                "https://www.goodreads.com/book_link/follow/8"
                                            ]
                                        }
                                    ]
                                }
                            ],
                            "series_works": [
                                {
                                    "series_work": [
                                        {
                                            "id": [
                                                "256034"
                                            ],
                                            "user_position": [
                                                "4"
                                            ],
                                            "series": [
                                                {
                                                    "id": [
                                                        "46208"
                                                    ],
                                                    "title": [
                                                        "\n\n    Imager Portfolio\n\n"
                                                    ],
                                                    "description": [
                                                        "\n\n    Rhennthyl has spent years as an apprentice painter and is finally nearing his goal of becoming a master artisan. Then, his entire life is transformed by a disastrous fire. But the blaze that took his master’s life and destroyed his livelihood revealed a secret power previously dormant in Rhenn: he is an imager—one of the few in the entire world who can visualize things and make them real. \r\n    \r\n    http://us.macmillan.com/series/TheImagerPortfolio\n\n"
                                                    ],
                                                    "note": [
                                                        "\n\n\n"
                                                    ],
                                                    "series_works_count": [
                                                        "8"
                                                    ],
                                                    "primary_work_count": [
                                                        "8"
                                                    ],
                                                    "numbered": [
                                                        "true"
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ],
                            "similar_books": [
                                {
                                    "book": [
                                        {
                                            "id": [
                                                "6632027"
                                            ],
                                            "title": [
                                                "Tracato (A Trial of Blood & Steel, #3)"
                                            ],
                                            "isbn": [
                                                "0733624189"
                                            ],
                                            "isbn13": [
                                                "9780733624186"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1337655254s/6632027.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1337655254m/6632027.jpg"
                                            ],
                                            "average_rating": [
                                                "4.05"
                                            ],
                                            "ratings_count": [
                                                "265"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "215710"
                                                            ],
                                                            "name": [
                                                                "Joel Shepherd"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "7107573"
                                            ],
                                            "title": [
                                                "City of Night (The House War, #2)"
                                            ],
                                            "isbn": [
                                                "075640598X"
                                            ],
                                            "isbn13": [
                                                "9780756405984"
                                            ],
                                            "small_image_url": [
                                                "https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"
                                            ],
                                            "image_url": [
                                                "https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"
                                            ],
                                            "average_rating": [
                                                "4.20"
                                            ],
                                            "ratings_count": [
                                                "481"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "6461009"
                                                            ],
                                                            "name": [
                                                                "Michelle West"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "13542644"
                                            ],
                                            "title": [
                                                "Crossed Blades (Fallen Blade, #3)"
                                            ],
                                            "isbn": [
                                                "1937007847"
                                            ],
                                            "isbn13": [
                                                "9781937007843"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1352684152s/13542644.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1352684152m/13542644.jpg"
                                            ],
                                            "average_rating": [
                                                "4.09"
                                            ],
                                            "ratings_count": [
                                                "460"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "492365"
                                                            ],
                                                            "name": [
                                                                "Kelly McCullough"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "1040469"
                                            ],
                                            "title": [
                                                "Stormed Fortress (Wars of Light & Shadow #8; Arc 3 - Alliance of Light, #5)"
                                            ],
                                            "isbn": [
                                                "0007217803"
                                            ],
                                            "isbn13": [
                                                "9780007217809"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1328040963s/1040469.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1328040963m/1040469.jpg"
                                            ],
                                            "average_rating": [
                                                "4.20"
                                            ],
                                            "ratings_count": [
                                                "526"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "8591"
                                                            ],
                                                            "name": [
                                                                "Janny Wurts"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "9787905"
                                            ],
                                            "title": [
                                                "The Book of Transformations (Legends of the Red Sun, #3)"
                                            ],
                                            "isbn": [
                                                "0230750060"
                                            ],
                                            "isbn13": [
                                                "9780230750067"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1340183566s/9787905.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1340183566m/9787905.jpg"
                                            ],
                                            "average_rating": [
                                                "3.76"
                                            ],
                                            "ratings_count": [
                                                "143"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "1440203"
                                                            ],
                                                            "name": [
                                                                "Mark Charan Newton"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "12826714"
                                            ],
                                            "title": [
                                                "Sharps"
                                            ],
                                            "isbn": [
                                                "031617775X"
                                            ],
                                            "isbn13": [
                                                "9780316177757"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1344269989s/12826714.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1344269989m/12826714.jpg"
                                            ],
                                            "average_rating": [
                                                "3.85"
                                            ],
                                            "ratings_count": [
                                                "562"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "240708"
                                                            ],
                                                            "name": [
                                                                "K.J. Parker"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "13096215"
                                            ],
                                            "title": [
                                                "The Straits of Galahesh (Lays of Anuskaya, #2)"
                                            ],
                                            "isbn": [
                                                "1597803499"
                                            ],
                                            "isbn13": [
                                                "9781597803496"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1362968747s/13096215.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1362968747m/13096215.jpg"
                                            ],
                                            "average_rating": [
                                                "3.85"
                                            ],
                                            "ratings_count": [
                                                "79"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "2851725"
                                                            ],
                                                            "name": [
                                                                "Bradley P. Beaulieu"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "7854686"
                                            ],
                                            "title": [
                                                "The Daemon Prism (Collegia Magica, #3)"
                                            ],
                                            "isbn": [
                                                ""
                                            ],
                                            "isbn13": [
                                                ""
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1330693058s/7854686.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1330693058m/7854686.jpg"
                                            ],
                                            "average_rating": [
                                                "3.92"
                                            ],
                                            "ratings_count": [
                                                "493"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "246590"
                                                            ],
                                                            "name": [
                                                                "Carol Berg"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "11217124"
                                            ],
                                            "title": [
                                                "Dancing With Eternity"
                                            ],
                                            "isbn": [
                                                "1603818103"
                                            ],
                                            "isbn13": [
                                                "9781603818100"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1328743107s/11217124.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1328743107m/11217124.jpg"
                                            ],
                                            "average_rating": [
                                                "4.17"
                                            ],
                                            "ratings_count": [
                                                "102"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "4815178"
                                                            ],
                                                            "name": [
                                                                "John Patrick Lowrie"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "137624"
                                            ],
                                            "title": [
                                                "Weavers of War (Winds of the Forelands, #5)"
                                            ],
                                            "isbn": [
                                                "0765312468"
                                            ],
                                            "isbn13": [
                                                "9780765312464"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1312029904s/137624.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1312029904m/137624.jpg"
                                            ],
                                            "average_rating": [
                                                "4.08"
                                            ],
                                            "ratings_count": [
                                                "309"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "41202"
                                                            ],
                                                            "name": [
                                                                "David B. Coe"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "8512555"
                                            ],
                                            "title": [
                                                "Spellbound (Spellwright, #2)"
                                            ],
                                            "isbn": [
                                                "0765356598"
                                            ],
                                            "isbn13": [
                                                "9780765356598"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1287663477s/8512555.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1287663477m/8512555.jpg"
                                            ],
                                            "average_rating": [
                                                "3.86"
                                            ],
                                            "ratings_count": [
                                                "674"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "1916427"
                                                            ],
                                                            "name": [
                                                                "Blake Charlton"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "11729275"
                                            ],
                                            "title": [
                                                "Intruder (Foreigner, #13)"
                                            ],
                                            "isbn": [
                                                "075640715X"
                                            ],
                                            "isbn13": [
                                                "9780756407155"
                                            ],
                                            "small_image_url": [
                                                "https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"
                                            ],
                                            "image_url": [
                                                "https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"
                                            ],
                                            "average_rating": [
                                                "4.14"
                                            ],
                                            "ratings_count": [
                                                "552"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "989968"
                                                            ],
                                                            "name": [
                                                                "C.J. Cherryh"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "16037931"
                                            ],
                                            "title": [
                                                "Child of the Sword (The Gods Within, #1)"
                                            ],
                                            "isbn": [
                                                ""
                                            ],
                                            "isbn13": [
                                                ""
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1349513574s/16037931.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1349513574m/16037931.jpg"
                                            ],
                                            "average_rating": [
                                                "3.98"
                                            ],
                                            "ratings_count": [
                                                "270"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "5203193"
                                                            ],
                                                            "name": [
                                                                "J.L. Doty"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "20627073"
                                            ],
                                            "title": [
                                                "The Child Prince (The Artifactor #1)"
                                            ],
                                            "isbn": [
                                                "0991039521"
                                            ],
                                            "isbn13": [
                                                "9780991039524"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1390576835s/20627073.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1390576835m/20627073.jpg"
                                            ],
                                            "average_rating": [
                                                "4.17"
                                            ],
                                            "ratings_count": [
                                                "60"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "5192582"
                                                            ],
                                                            "name": [
                                                                "Honor Raconteur"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "599217"
                                            ],
                                            "title": [
                                                "Unto the Breach (Paladin of Shadows, #4)"
                                            ],
                                            "isbn": [
                                                "1416509402"
                                            ],
                                            "isbn13": [
                                                "9781416509400"
                                            ],
                                            "small_image_url": [
                                                "https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"
                                            ],
                                            "image_url": [
                                                "https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"
                                            ],
                                            "average_rating": [
                                                "4.12"
                                            ],
                                            "ratings_count": [
                                                "1201"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "14219"
                                                            ],
                                                            "name": [
                                                                "John Ringo"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "13400527"
                                            ],
                                            "title": [
                                                "The Sorcerer's Torment (The Sorcerer's Path, #2)"
                                            ],
                                            "isbn": [
                                                ""
                                            ],
                                            "isbn13": [
                                                ""
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1328065135s/13400527.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1328065135m/13400527.jpg"
                                            ],
                                            "average_rating": [
                                                "4.15"
                                            ],
                                            "ratings_count": [
                                                "372"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "5224774"
                                                            ],
                                                            "name": [
                                                                "Brock Deskins"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "10201356"
                                            ],
                                            "title": [
                                                "Debris (The Veiled Worlds, #1)"
                                            ],
                                            "isbn": [
                                                "085766154X"
                                            ],
                                            "isbn13": [
                                                "9780857661548"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1305289469s/10201356.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1305289469m/10201356.jpg"
                                            ],
                                            "average_rating": [
                                                "3.48"
                                            ],
                                            "ratings_count": [
                                                "428"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "4577009"
                                                            ],
                                                            "name": [
                                                                "Jo Anderton"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": [
                                                "13550502"
                                            ],
                                            "title": [
                                                "The Ill-Made Knight"
                                            ],
                                            "isbn": [
                                                "1409142418"
                                            ],
                                            "isbn13": [
                                                "9781409142416"
                                            ],
                                            "small_image_url": [
                                                "https://d.gr-assets.com/books/1377004653s/13550502.jpg"
                                            ],
                                            "image_url": [
                                                "https://d.gr-assets.com/books/1377004653m/13550502.jpg"
                                            ],
                                            "average_rating": [
                                                "4.50"
                                            ],
                                            "ratings_count": [
                                                "122"
                                            ],
                                            "authors": [
                                                {
                                                    "author": [
                                                        {
                                                            "id": [
                                                                "710888"
                                                            ],
                                                            "name": [
                                                                "Christian Cameron"
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        })

        it('Should correctly parse book', function () {
            var parsed_data = ParseExternalService.parse_goodreads_book_details(goodreads_book_basic);
            var parsed_book = parsed_data;
            parsed_book.title.should.eql("Scholar (Imager Portfolio, #4)");
            parsed_book.isbn.should.eql("9780765329554");
            should(function(){
                (parsed_book.amazon_id == null).be.true
            })
            parsed_book.average_rating.should.eql(4.07);
            parsed_book.ratings_count.should.eql(1222);

            parsed_book.series_name.should.eql("Imager Portfolio");
            parsed_book.series_number.should.eql(4);
            parsed_book.short_summary.should.eql("Hundreds of years before the time of Imager, the continent of Lydar is fragmented.  Years of war have consolidated five nations into three — Bovaria, Telaryn, and Antiago. Quaeryt is a scholar and a friend of Bhayar, the young ruler of Telaryn. Worried about his future and the escalating intrigues in Solis, the capital city, Quaeryt persuades Bhayar to send him to Tilbor, conquered ten years earlier by Bhayar’s father, in order to see if the number and extent of occupying troops can be reduced so that they can be re-deployed to the border with warlike Bovaria.<br><br>Quaeryt has managed to conceal the fact that he is an imager, since the life expectancies of imagers in Lydar is short. Just before Quaeryt departs, Bhayar’s youngest sister passes a letter to the scholar-imager, a letter that could well embroil Quaeryt in the welter of court politics he had hoped to leave behind. On top of that, on his voyage and journey to Tilbor he must face pirates, storms, poisonings, attempted murder, as well as discovering the fact that he is not quite who he thought he was. To make it all worse, the order of scholars to which he belongs is jeopardized in more ways than one.");
            parsed_book.tags.should.eql([
                "fantasy",
                "fiction",
                "epic-fantasy",
                "favorites",
                "modesitt",
                "imager-portfolio",
                "library"
            ]);
            parsed_book.authors.should.eql([
                {
                    "name": "L.E. Modesitt Jr.",
                    "goodreads_id": "1301649"
                }
            ]);

            parsed_book.image.identifier.should.eql("https://d.gr-assets.com/books/1316731170l/11045423.jpg");
        });
    })

    describe('#parse_goodreads_search_results()', function () {
        var goodreads_search_array, goodreads_search_single, goodreads_search_empty;

        before(function () {
            goodreads_search_array = {"GoodreadsResponse":{"Request":[{"authentication":["true"],"key":["VEjXc5XWMAeIJYoHlqZK8w"],"method":["search_index"]}],"search":[{"query":["Imager - L.E. Modesitt Jr."],"results-start":["1"],"results-end":["9"],"total-results":["9"],"source":["Goodreads"],"query-time-seconds":["0.04"],"results":[{"work":[{"books_count":[{"_":"16","$":{"type":"integer"}}],"id":[{"_":"4693480","$":{"type":"integer"}}],"original_publication_day":[{"_":"17","$":{"type":"integer"}}],"original_publication_month":[{"_":"3","$":{"type":"integer"}}],"original_publication_year":[{"_":"2009","$":{"type":"integer"}}],"ratings_count":[{"_":"4011","$":{"type":"integer"}}],"text_reviews_count":[{"_":"250","$":{"type":"integer"}}],"average_rating":["3.98"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"4643301","$":{"type":"integer"}}],"title":["Imager (Imager Portfolio, #1)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"],"small_image_url":["https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"]}]},{"books_count":[{"_":"10","$":{"type":"integer"}}],"id":[{"_":"15966126","$":{"type":"integer"}}],"original_publication_day":[{"$":{"type":"integer","nil":"true"}}],"original_publication_month":[{"_":"11","$":{"type":"integer"}}],"original_publication_year":[{"_":"2011","$":{"type":"integer"}}],"ratings_count":[{"_":"1382","$":{"type":"integer"}}],"text_reviews_count":[{"_":"90","$":{"type":"integer"}}],"average_rating":["4.07"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"11045423","$":{"type":"integer"}}],"title":["Scholar (Imager Portfolio, #4)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://d.gr-assets.com/books/1316731170m/11045423.jpg"],"small_image_url":["https://d.gr-assets.com/books/1316731170s/11045423.jpg"]}]},{"books_count":[{"_":"10","$":{"type":"integer"}}],"id":[{"_":"18293875","$":{"type":"integer"}}],"original_publication_day":[{"_":"22","$":{"type":"integer"}}],"original_publication_month":[{"_":"5","$":{"type":"integer"}}],"original_publication_year":[{"_":"2012","$":{"type":"integer"}}],"ratings_count":[{"_":"1182","$":{"type":"integer"}}],"text_reviews_count":[{"_":"59","$":{"type":"integer"}}],"average_rating":["4.14"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"13118885","$":{"type":"integer"}}],"title":["Princeps (Imager Portfolio, #5)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://d.gr-assets.com/books/1344317727m/13118885.jpg"],"small_image_url":["https://d.gr-assets.com/books/1344317727s/13118885.jpg"]}]},{"books_count":[{"_":"12","$":{"type":"integer"}}],"id":[{"_":"6596460","$":{"type":"integer"}}],"original_publication_day":[{"_":"12","$":{"type":"integer"}}],"original_publication_month":[{"_":"10","$":{"type":"integer"}}],"original_publication_year":[{"_":"2009","$":{"type":"integer"}}],"ratings_count":[{"_":"2664","$":{"type":"integer"}}],"text_reviews_count":[{"_":"98","$":{"type":"integer"}}],"average_rating":["4.06"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"6407550","$":{"type":"integer"}}],"title":["Imager's Challenge (Imager Portfolio, #2)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://d.gr-assets.com/books/1312055254m/6407550.jpg"],"small_image_url":["https://d.gr-assets.com/books/1312055254s/6407550.jpg"]}]},{"books_count":[{"_":"8","$":{"type":"integer"}}],"id":[{"_":"7860898","$":{"type":"integer"}}],"original_publication_day":[{"$":{"type":"integer","nil":"true"}}],"original_publication_month":[{"_":"7","$":{"type":"integer"}}],"original_publication_year":[{"_":"2010","$":{"type":"integer"}}],"ratings_count":[{"_":"2106","$":{"type":"integer"}}],"text_reviews_count":[{"_":"95","$":{"type":"integer"}}],"average_rating":["4.08"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"7199136","$":{"type":"integer"}}],"title":["Imager's Intrigue (Imager Portfolio, #3)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"],"small_image_url":["https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"]}]},{"books_count":[{"_":"7","$":{"type":"integer"}}],"id":[{"_":"21455003","$":{"type":"integer"}}],"original_publication_day":[{"_":"22","$":{"type":"integer"}}],"original_publication_month":[{"_":"1","$":{"type":"integer"}}],"original_publication_year":[{"_":"2013","$":{"type":"integer"}}],"ratings_count":[{"_":"922","$":{"type":"integer"}}],"text_reviews_count":[{"_":"66","$":{"type":"integer"}}],"average_rating":["4.13"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"15757055","$":{"type":"integer"}}],"title":["Imager's Battalion (Imager Portfolio, #6)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://d.gr-assets.com/books/1342560972m/15757055.jpg"],"small_image_url":["https://d.gr-assets.com/books/1342560972s/15757055.jpg"]}]},{"books_count":[{"_":"7","$":{"type":"integer"}}],"id":[{"_":"21846206","$":{"type":"integer"}}],"original_publication_day":[{"_":"28","$":{"type":"integer"}}],"original_publication_month":[{"_":"5","$":{"type":"integer"}}],"original_publication_year":[{"_":"2013","$":{"type":"integer"}}],"ratings_count":[{"_":"729","$":{"type":"integer"}}],"text_reviews_count":[{"_":"46","$":{"type":"integer"}}],"average_rating":["4.10"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"16059444","$":{"type":"integer"}}],"title":["Antiagon Fire (Imager Portfolio, #7)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://d.gr-assets.com/books/1367749501m/16059444.jpg"],"small_image_url":["https://d.gr-assets.com/books/1367749501s/16059444.jpg"]}]},{"books_count":[{"_":"8","$":{"type":"integer"}}],"id":[{"_":"25095577","$":{"type":"integer"}}],"original_publication_day":[{"_":"7","$":{"type":"integer"}}],"original_publication_month":[{"_":"1","$":{"type":"integer"}}],"original_publication_year":[{"_":"2014","$":{"type":"integer"}}],"ratings_count":[{"_":"517","$":{"type":"integer"}}],"text_reviews_count":[{"_":"47","$":{"type":"integer"}}],"average_rating":["4.07"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"17910122","$":{"type":"integer"}}],"title":["Rex Regis (Imager Portfolio, #8)"],"author":[{"id":[{"_":"1301649","$":{"type":"integer"}}],"name":["L.E. Modesitt Jr."]}],"image_url":["https://d.gr-assets.com/books/1373660829m/17910122.jpg"],"small_image_url":["https://d.gr-assets.com/books/1373660829s/17910122.jpg"]}]},{"books_count":[{"_":"1","$":{"type":"integer"}}],"id":[{"_":"41612078","$":{"type":"integer"}}],"original_publication_day":[{"_":"3","$":{"type":"integer"}}],"original_publication_month":[{"_":"3","$":{"type":"integer"}}],"original_publication_year":[{"_":"2015","$":{"type":"integer"}}],"ratings_count":[{"_":"0","$":{"type":"integer"}}],"text_reviews_count":[{"_":"0","$":{"type":"integer"}}],"average_rating":[{"_":"0.0","$":{"type":"float"}}],"best_book":[{"$":{"type":"Book"},"id":[{"_":"22238209","$":{"type":"integer"}}],"title":["Madness in Solidar: The Ninth Book of the Imager Portfolio"],"author":[{"id":[{"_":"8161250","$":{"type":"integer"}}],"name":["L E Modesitt  Jr"]}],"image_url":["https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"],"small_image_url":["https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"]}]}]}]}]}}
            goodreads_search_single ={"GoodreadsResponse":{"Request":[{"authentication":["true"],"key":["VEjXc5XWMAeIJYoHlqZK8w"],"method":["search_index"]}],"search":[{"query":["Abaddons Gate - S.A. Corey"],"results-start":["1"],"results-end":["1"],"total-results":["1"],"source":["Goodreads"],"query-time-seconds":["0.03"],"results":[{"work":[{"books_count":[{"_":"15","$":{"type":"integer"}}],"id":[{"_":"17606564","$":{"type":"integer"}}],"original_publication_day":[{"_":"1","$":{"type":"integer"}}],"original_publication_month":[{"_":"1","$":{"type":"integer"}}],"original_publication_year":[{"_":"2013","$":{"type":"integer"}}],"ratings_count":[{"_":"7293","$":{"type":"integer"}}],"text_reviews_count":[{"_":"708","$":{"type":"integer"}}],"average_rating":["4.15"],"best_book":[{"$":{"type":"Book"},"id":[{"_":"16131032","$":{"type":"integer"}}],"title":["Abaddon's Gate (Expanse, #3)"],"author":[{"id":[{"_":"4192148","$":{"type":"integer"}}],"name":["James S.A. Corey"]}],"image_url":["https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png"],"small_image_url":["https://s.gr-assets.com/assets/nophoto/book/50x75-673c574e721a5d4c3fd6e25b74d42bf2.png"]}]}]}]}]}}
            goodreads_search_empty = {"GoodreadsResponse":{"Request":[{"authentication":["true"],"key":["VEjXc5XWMAeIJYoHlqZK8w"],"method":["search_index"]}],"search":[{"query":["Completely Unreal - S.A. Corey"],"results-start":["1"],"results-end":["0"],"total-results":["0"],"source":["Goodreads"],"query-time-seconds":["0.01"],"results":["\n    "]}]}}
        })

        it('Should correctly parse multiple search results', function () {
            var parsed_results = ParseExternalService.parse_goodreads_search_results(goodreads_search_array);

            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(9)

            var first_result = parsed_results[0];

            first_result.id.should.eql("4643301");
            first_result.title.should.eql("Imager (Imager Portfolio, #1)");
            first_result.author.should.eql("L.E. Modesitt Jr.");
            first_result.image_url.should.eql("https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png");
            first_result.average_rating.should.eql(3.98);
            first_result.ratings_count.should.eql("4011");
            first_result.publication_year.should.eql("2009");

        });

        it('Should correctly parse single search result single', function () {
            var parsed_results = ParseExternalService.parse_goodreads_search_results(goodreads_search_single);

            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(1)

            var first_result = parsed_results[0];

            first_result.id.should.eql("16131032");
            first_result.title.should.eql("Abaddon's Gate (Expanse, #3)");
            first_result.author.should.eql("James S.A. Corey");
            first_result.image_url.should.eql('https://s.gr-assets.com/assets/nophoto/book/111x148-0bc7d2a334eb7b34f3ef3fe4286bcf79.png');
            first_result.average_rating.should.eql(4.15);
            first_result.ratings_count.should.eql("7293");
            first_result.publication_year.should.eql("2013");

        });

        it('Should correctly parse empty search result', function () {
            var parsed_results = ParseExternalService.parse_goodreads_search_results(goodreads_search_empty);

            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(0)

        });
    });

    describe('#parse_goodreads_search_author()', function(){
        var goodreads_author_search_empty, goodreads_author_search_result;
        before(function(){
            goodreads_author_search_result =  {"Request":{"authentication":"true","key":"VEjXc5XWMAeIJYoHlqZK8w","method":"api_author_link"},"author":{"@":{"id":"1301649"},"name":"L.E. Modesitt Jr.","link":"https://www.goodreads.com/author/show/1301649.L_E_Modesitt_Jr_?utm_medium=api&utm_source=author_link"}}
            goodreads_author_search_empty = {"Request":{"authentication":"true","key":"VEjXc5XWMAeIJYoHlqZK8w","method":"api_author_link"}}
        })
        it('Should correctly parse empty author search result', function () {
            var parsed_results = ParseExternalService.parse_goodreads_search_author(goodreads_author_search_empty);

            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(0)

        });
        it('Should correctly parse author search result', function () {
            var parsed_results = ParseExternalService.parse_goodreads_search_author(goodreads_author_search_result);

            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(1)

            var author_result = parsed_results[0];

            author_result.external.should.be.true;
            author_result.id.should.eql('1301649')
            author_result.name.should.eql('L.E. Modesitt Jr.')

        });
    })

    describe('#parse_goodreads_shelves', function(){
        var goodreads_shelves_response;
        before(function(){
            goodreads_shelves_response = {
                "GoodreadsResponse": {
                    "Request": [
                        {
                            "authentication": [
                                "true"
                            ],
                            "key": [
                                "VEjXc5XWMAeIJYoHlqZK8w"
                            ],
                            "method": [
                                "shelf_list"
                            ]
                        }
                    ],
                    "shelves": [
                        {
                            "$": {
                                "start": "1",
                                "end": "4",
                                "total": "4"
                            },
                            "user_shelf": [
                                {
                                    "id": [
                                        {
                                            "_": "28684905",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "name": [
                                        "read"
                                    ],
                                    "book_count": [
                                        {
                                            "_": "239",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "exclusive_flag": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "description": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "sort": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "order": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "per_page": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "display_fields": [
                                        null
                                    ],
                                    "featured": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "recommend_for": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "sticky": [
                                        {
                                            "$": {
                                                "type": "boolean",
                                                "nil": "true"
                                            }
                                        }
                                    ]
                                },
                                {
                                    "id": [
                                        {
                                            "_": "28684904",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "name": [
                                        "currently-reading"
                                    ],
                                    "book_count": [
                                        {
                                            "_": "0",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "exclusive_flag": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "description": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "sort": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "order": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "per_page": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "display_fields": [
                                        null
                                    ],
                                    "featured": [
                                        {
                                            "_": "false",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "recommend_for": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "sticky": [
                                        {
                                            "$": {
                                                "type": "boolean",
                                                "nil": "true"
                                            }
                                        }
                                    ]
                                },
                                {
                                    "id": [
                                        {
                                            "_": "28684903",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "name": [
                                        "to-read"
                                    ],
                                    "book_count": [
                                        {
                                            "_": "163",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "exclusive_flag": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "description": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "sort": [
                                        "position"
                                    ],
                                    "order": [
                                        "a"
                                    ],
                                    "per_page": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "display_fields": [
                                        null
                                    ],
                                    "featured": [
                                        {
                                            "_": "false",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "recommend_for": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "sticky": [
                                        {
                                            "$": {
                                                "type": "boolean",
                                                "nil": "true"
                                            }
                                        }
                                    ]
                                },
                                {
                                    "id": [
                                        {
                                            "_": "45484891",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "name": [
                                        "testingquietthyme"
                                    ],
                                    "book_count": [
                                        {
                                            "_": "1",
                                            "$": {
                                                "type": "integer"
                                            }
                                        }
                                    ],
                                    "exclusive_flag": [
                                        {
                                            "_": "false",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "description": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "sort": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "order": [
                                        {
                                            "$": {
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "per_page": [
                                        {
                                            "$": {
                                                "type": "integer",
                                                "nil": "true"
                                            }
                                        }
                                    ],
                                    "display_fields": [
                                        null
                                    ],
                                    "featured": [
                                        {
                                            "_": "false",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "recommend_for": [
                                        {
                                            "_": "true",
                                            "$": {
                                                "type": "boolean"
                                            }
                                        }
                                    ],
                                    "sticky": [
                                        {
                                            "$": {
                                                "type": "boolean",
                                                "nil": "true"
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }

        })

        it('Should correctly parse list of shelves', function () {
            var parsed_results = ParseExternalService.parse_goodreads_shelves(goodreads_shelves_response);
            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(4)
            parsed_results.should.eql([
                { name: 'read' },
                { name: 'currently-reading' },
                { name: 'to-read' },
                { name: 'testingquietthyme' }
            ])
        });
    })

    describe('#parse_goodreads_shelf_content', function() {
        var goodreads_shelf_content_response;
        before(function (done) {
            var fs = require('fs')
            fs.readFile('./test/files/goodreads_shelf_content.json', function (err, data) {
                goodreads_shelf_content_response = JSON.parse(data)
                done();
            })
        })
        it('Should correctly parse shelf content', function () {
            var parsed_results = ParseExternalService.parse_goodreads_shelf_content(goodreads_shelf_content_response);
            parsed_results.should.be.an.Array;
            parsed_results.should.have.a.lengthOf(40)
            parsed_results[1].isbn.should.eql('9780434020805');
            parsed_results[1].isbn10.should.eql('043402080X');
            parsed_results[1].goodreads_id.should.eql('10079321');

        })
    })
});