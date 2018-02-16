'use strict';

const setCookie = function(response, cookie) {
    console.log(`Setting cookie ${cookie}`);
    response.headers['set-cookie'] = [{ key: "Set-Cookie", value: cookie }];    
}

const cookieMain = 'X-Experiment=main';
const cookieExperimentA = 'X-Experiment=A';    

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
   
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;    
    const requestHeaders = request.headers;
    const responseHandler = response.headers;    

    // Add Set-Cookie header, base on the header in the request.
    // Remember the Cookie in the request may have been added by the Request Lambda@Edge 
    // and not coming from the browser

    let originName;
    if (requestHeaders.cookie) {
        for (let i = 0; i < requestHeaders.cookie.length; i++) {        
            if (requestHeaders.cookie[i].value.indexOf(cookieExperimentA) >= 0) {
                console.log('Experiment A cookie found');
                originName = 'experiment';
                break;
            }
            if (requestHeaders.cookie[i].value.indexOf(cookieMain) >= 0) {
                console.log('Main cookie found');
                originName = 'main';
                break;
            }            
        }
    }    

    if ( originName === 'experiment' ) {
        setCookie(response, cookieExperimentA);
    } else {
        setCookie(response, cookieMain);
    }

    console.log('Response forwarded:', JSON.stringify(response, null, 2));   
    callback(null, response); 
}

