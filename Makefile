

build:
	docker-compose -f docker-compose.test.yml pull && docker-compose -f docker-compose.test.yml build

test: build
	docker-compose -f docker-compose.test.yml run api 'npm run-script coverage'

# Destroy all docker containers
clean:
	docker-compose down