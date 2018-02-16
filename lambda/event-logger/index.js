// Logs the event and forward request or response
// For troubleshooting and debugging 

// For Viewer Request or Origin Request triggers
exports.requestInterceptor = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const request = event.Records[0].cf.request;
    console.log('Forwarding request');
    callback(null, request);
}

// For Viewer Response or Origin Response triggers
exports.responseInterceptor = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const response = event.Records[0].cf.response;
    console.log('Forwarding response');
    callback(null, response);
}