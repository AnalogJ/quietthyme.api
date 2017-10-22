var updated = 0;

module.exports = function(record, dyno, callback) {

  console.log('updating %s ', record.id);

  // If you are running a dry-run, `dyno` will be null
  if (!dyno) return callback();

  //skip the the primary_author field already exists.
  if (record.primary_author){return callback()}

  dyno.updateItem({
    Key: { id: record.id, user_id: record.user_id },
    UpdateExpression: 'set #a = :a',
    ExpressionAttributeNames: {'#a' : 'primary_author'},
    ExpressionAttributeValues: {
      ':a' : record.authors ? record.authors[0] : 'Unknown Author',
    }
  }, function(err) {
    if (err) {
      console.error('%s failed to update', record.id);

      // Sending an error to the callback function will stop the migration
      return callback(new Error('A record failed to delete'));
    }

    updated++;
    callback();
  });
}

module.exports.finish = function(dyno, callback) {
  console.log('Updated %s records', updated);
  callback();
}