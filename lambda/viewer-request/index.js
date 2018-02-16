'use strict';

const sourceCoookie = 'X-Source';
const sourceMain = 'main';
const sourceExperiment = 'experiment';
const experimentTraffic = 0.5;

// Viewer request handler
// Look for Source cookie. If not present, roll dice, decide which source to use and add the Source cookie.
// Source cookie must be forwarded to origin (whitelisted) so it is used as part of the cache key
//
// TODO Comment out verbose logging
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Look for source cookie
    if ( headers.cookie ) {
        for (let i = 0; i < headers.cookie.length; i++) {        
            if (headers.cookie[i].value.indexOf(sourceCoookie) >= 0) {
                console.log('Source cookie found. Forwarding request as-is');
                // Forward request as-is
                forwardRequest(request, callback);
                return;
            }         
        }       
    }

    console.log('Source cookie has not been found. Throwing dice...');
    const source = ( Math.random() < experimentTraffic ) ? sourceExperiment : sourceMain;
    console.log(`Source: ${source}`)

    // Add Source cookie
    const cookie = `${sourceCoookie}=${source}`
    console.log(`Adding cookie header: ${cookie}`);
    headers.cookie = headers.cookie || [];
    headers.cookie.push({ key:'Cookie', value: cookie });

    // Forwarding request
    forwardRequest(request, callback);
};


const forwardRequest = function(request, callback) {
    console.log('Forward request:', JSON.stringify(request, null, 2));
    callback(null, request);
}



