exports.requestInterceptor = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const request = event.Records[0].cf.request;
    console.log('Forwarding request');
    callback(null, request);
}

exports.responseInterceptor = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const response = event.Records[0].cf.response;
    console.log('Forwarding response');
    callback(null, response);
}