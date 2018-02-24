'use strict';

const sourceCoookie = 'X-Source';
const sourceMain = 'main';
const sourceExperiment = 'experiment';
const experimentTraffic = 0.5;

const experimentBucketEndpoint = 'my-experiment.s3.amazonaws.com';
const experimentBucketRegion = 'eu-west-1';

// Origin Request handler
// 1) If the source cookie is not present, decide a source randomly and send back a redirect with Set-Cookie and Cache-Control=no-store
// 2) If the source cookie is present and is 'experiment', change the orgin and host header to point the experiment bucket
// 3) If the source cookie has any other value, forward the request as-is to the default origin (main)
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Look for source cookie
    const source = getSource(headers);

    // If Source is undecided roll dice and send directly a Redirect with the Set-Cookie and Cache-Control=no-store
    if ( !source ) {
        const newSource = ( Math.random() < experimentTraffic ) ? sourceExperiment : sourceMain;
        console.log('Dice rolled. Source:', newSource);

        // Send a redirect with Set-Cookie header and Cache-control no-store
        const response = {
            status: 302,
            headers: {
                'cache-control': [{
                    key: 'Cache-Control',
                    value: 'no-store' 
                }],
                'set-cookie': [{
                    key: 'Set-Cookie',
                    value: `${sourceCoookie}=${newSource}; Path=/`
                }],
                'location': [{
                    key: 'Location',
                    value: request.uri
                }]
            }
        }

        // Send response
        console.log('Sending Response:', JSON.stringify(response, null, 2));
        callback(null, response);
        return;
    }

    // If Source is Experiment, change Origin and Host header
    if ( source === sourceExperiment ) {
        console.log('Setting Origin to experiment bucket');
        // Specify Origin
        request.origin = {
            s3: {
                authMethod: 'origin-access-identity',
                domainName: experimentBucketEndpoint,
                path: '',
                region: experimentBucketRegion    
            }
        };

        // Also set Host header to prevent “The request signature we calculated does not match the signature you provided” error
        headers['host'] = [{key: 'host', value: experimentBucketEndpoint }];
    }
    // No need to change anything if Source was Main or undefined
    
    console.log('Request forwarded:', JSON.stringify(request, null, 2));
    callback(null, request);
};


// Decide source based on source cookie.
const getSource = function(headers) {
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
