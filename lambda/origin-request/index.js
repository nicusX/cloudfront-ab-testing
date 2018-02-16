'use strict';

const sourceCoookie = 'X-Source';
const sourceMain = 'main';
const sourceExperiment = 'experiment';

const experimentBucketName = 'ab-testing-poc-experiment.s3.amazonaws.com';
const experimentBucketRegion = 'eu-west-1';

// Origin Request handler
// Switch Origin if request contains Experiment Source cookie
// If no Source cookie is present or if Source cookie points to main, request is not changed: served as by default behavour, so by Main
// Source cookie must be forwarded to origin (whitelisted) so it is used as part of the cache key
//
// TODO Comment out verbose logging
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Decide source to use
    const source = decideSource(headers);

    // If Source is Experiment, change Origin and Host header
    if ( source === sourceExperiment ) {
        console.log('Setting Origin to experiment bucket');
        // Specify Origin
        request.origin = {
            s3: {
                authMethod: 'origin-access-identity',
                domainName: experimentBucketName,
                path: '',
                region: experimentBucketRegion    
            }
        };

        // Also set Host header to prevent “The request signature we calculated does not match the signature you provided” error
        headers['host'] = [{key: 'host', value: experimentBucketName }];
    }
    // No need to change anything if Source was Main or undefined
    
    console.log('Request forwarded:', JSON.stringify(request, null, 2));
    callback(null, request);
};


// Decide source based on source cookie.
const decideSource = function(headers) {
    const sourceMainCookie = `${sourceCoookie}=${sourceMain}`;
    const sourceExperimenCookie = `${sourceCoookie}=${sourceExperiment}`;
    
    // Remember a single cookie header entry may contains multiple cookies
    if (headers.cookie) {

        // ...ugly but simple enough for now
        for (let i = 0; i < headers.cookie.length; i++) {        
            if (headers.cookie[i].value.indexOf(sourceExperimenCookie) >= 0) {
                console.log('Experiment Source cookie found');
                return sourceExperiment;
            }
            if (headers.cookie[i].value.indexOf(sourceMainCookie) >= 0) {
                console.log('Main Source cookie found');
                return sourceMain;
            }            
        }
    }
    console.log('No Source cookie found (Origin undecided)');
}
