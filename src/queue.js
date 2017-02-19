module.exports = {

    // this function gets called in 2 cases.
    //
    // 1. a book is added to a blackhole folder.
    // 2. a book is NEW book (manually uploaded via the WebUI) and is stored in upload bucket. (triggered by storage.process_book method)
    //
    // Then the following steps will occur:
    // will determine the book's current location. (source_storage_type, source_storage_identifier)
    // will determine the book's destination location (dest_storage_type, dest_storage_identifier)
    //
    process_unknown_book: function(event, context, cb){
        console.log("JUST TESTING UNKONWN HOOK", event)
        cb(null,"JUST TESTING")
    }
}