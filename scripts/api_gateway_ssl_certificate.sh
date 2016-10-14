#!/usr/bin/env bash

export DOMAIN=api.quietthyme.com
export PROVIDER=cloudflare
#export LEXICON_CLOUDFLARE_USERNAME=*Should be set in env*
#export LEXICON_CLOUDFLARE_TOKEN=*Should be set in env*

# create config file (keysize for AWS has to be 2048)
echo 'KEYSIZE="2048"' > dehydrated_config.txt

# generate SSL Certificates for quietthyme
docker run \
-e LEXICON_CLOUDFLARE_USERNAME=$LEXICON_CLOUDFLARE_USERNAME \
-e LEXICON_CLOUDFLARE_TOKEN=$LEXICON_CLOUDFLARE_TOKEN \
-v `pwd`/certs:/srv/dehydrated/certs \
-v `pwd`/dehydrated_config.txt:/srv/dehydrated/config \
--rm \
analogj/lexicon /srv/dehydrated/dehydrated \
--domain $DOMAIN \
--cron \
--hook /srv/dehydrated/dehydrated.default.sh \
--challenge dns-01

# register certificate with AWS
DIST_DOMAIN_NAME=`aws apigateway create-domain-name \
--domain-name "$DOMAIN" \
--certificate-name "lexicon-$(date +"%d-%m-%Y")" \
--certificate-body "$(cat certs/$DOMAIN/cert.pem)" \
--certificate-private-key "$(cat certs/$DOMAIN/privkey.pem)" \
--certificate-chain "$(cat certs/$DOMAIN/chain.pem)" | \
python -c "import sys, json; print json.load(sys.stdin)['distributionDomainName']"`

# add CNAME with cloudflare pointing to AWS distribution domain name
lexicon cloudflare create $DOMAIN CNAME \
--name="$DOMAIN" \
--content="$DIST_DOMAIN_NAME"


#cleanup
rm -f dehydrated_config.txt
#rm -rf certs/$DOMAIN