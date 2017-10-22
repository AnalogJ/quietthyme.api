# QuietThyme API
[![Project](https://img.shields.io/badge/project-waffle.io-blue.svg)](http://waffle.io/AnalogJ/quietthyme.api)
[![CircleCI](https://circleci.com/gh/AnalogJ/quietthyme.api.svg?style=shield)](https://circleci.com/gh/AnalogJ/quietthyme.api)
[![Coverage Status](https://coveralls.io/repos/github/AnalogJ/quietthyme.api/badge.svg?branch=beta)](https://coveralls.io/github/AnalogJ/quietthyme.api?branch=beta)
[![GitHub license](https://img.shields.io/github/license/AnalogJ/quietthyme.api.svg)](https://github.com/AnalogJ/quietthyme.api/blob/master/LICENSE)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# TODO:
- update the cloudformation-resources.json file to generate the Postgres RDS, IAM role & SG's
- Setup status codes and general wrapper for all responses - https://serverless.com/framework/docs/providers/aws/events/apigateway/#lambda



curl -i https://api.quietthyme.com/dev/test \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDc2NTczODM3LCJleHAiOjE0NzY1ODQ2Mzd9.5RvK3d1mdxD7xXOOAfEpZENdU68fk0dDqb0DMP4VzWo"

curl -i https://api.quietthyme.com/dev/book \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDc2NTg1Mjc2LCJleHAiOjE0NzY1OTYwNzZ9.u-FcKHQiwgRGlbf2ORbVboAJsRAqSEG8Q5M4DiHjIyY"


curl -i https://api.quietthyme.com/dev/auth/calibre?library_uuid=12345 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNDc2NTg1Mjc2LCJleHAiOjE0NzY1OTYwNzZ9.u-FcKHQiwgRGlbf2ORbVboAJsRAqSEG8Q5M4DiHjIyY"


aws logs get-log-events --log-group-name "/aws/lambda/quietthyme-api-dev-test" --log-stream-name "2016/11/07/[\$LATEST]31236a7169424ffc90bfd00aae5294f3" --output text > a.log


api.quietthyme.com/v1/catalog/123456

# Instructions
- Deploy
- Kloudless App Details page.
	- Enable event collection for recent activity and collect events checkboxes
	- Configure current webhooks url
	- Trusted domains should include beta.quietthyme.com or www.quietthyme.com
- Kloudless Security Crednetials page.
	- Register custom app credentials for all storage apps.
- Storage Services:
	- Register webhooks for Dropbox, Box, GDrive that push events to kloudless.
- Email
	- Add mailchimp webhook to point to quietthyme.com

# Local Development

- docker-compose up --build
- npm test

# Debugging

- Access the DynamoDB shell at http://localhost:6001/shell

# Migrations

Dry Run:

	./node_modules/dynamodb-migrator/bin/migrate.js scan us-east-1/quietthyme-api-beta-books ./migrations/2017-10-22-add-primary-authors-key-to-books-table.js

Live Migration

	./node_modules/dynamodb-migrator/bin/migrate.js scan us-east-1/quietthyme-api-beta-books ./migrations/2017-10-22-add-primary-authors-key-to-books-table.js --live