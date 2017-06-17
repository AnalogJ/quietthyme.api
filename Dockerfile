FROM node:6.10

WORKDIR /var/task
ADD . ./
RUN chmod +x scripts/* && \
	npm install