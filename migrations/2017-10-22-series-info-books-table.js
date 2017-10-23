var updated = 0;

module.exports = function(record, dyno, callback) {

  console.log('updating %s ', record.id);

  // If you are running a dry-run, `dyno` will be null
  if (!dyno) return callback();



  dyno.updateItem({
    Key: { id: record.id, user_id: record.user_id },
    UpdateExpression: 'set #snum = :snum',
    ExpressionAttributeNames: {'#snum' : 'series_number'},
    ExpressionAttributeValues: {
      ':snum' : record.series_number != null ? record.series_number.toString() : '',
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