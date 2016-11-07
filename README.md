# QuietThyme API

# TODO:
- update the cloudformation-resources.json file to generate the Postgres RDS, IAM role & SG's
- Setup status codes and general wrapper for all responses - https://serverless.com/framework/docs/providers/aws/events/apigateway/#lambda



curl -i https://api.quietthyme.com/dev/test \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDc2NTczODM3LCJleHAiOjE0NzY1ODQ2Mzd9.5RvK3d1mdxD7xXOOAfEpZENdU68fk0dDqb0DMP4VzWo"

curl -i https://api.quietthyme.com/dev/book \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDc2NTg1Mjc2LCJleHAiOjE0NzY1OTYwNzZ9.u-FcKHQiwgRGlbf2ORbVboAJsRAqSEG8Q5M4DiHjIyY"


curl -i https://api.quietthyme.com/dev/auth/calibre?library_uuid=12345 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDc2NTg1Mjc2LCJleHAiOjE0NzY1OTYwNzZ9.u-FcKHQiwgRGlbf2ORbVboAJsRAqSEG8Q5M4DiHjIyY"


aws logs get-log-events --log-group-name "/aws/lambda/quietthyme-api-dev-test" --log-stream-name "2016/11/06/[\$LATEST]b83938961fcf4042993da2ee80bdc0a4" --output text > a.log