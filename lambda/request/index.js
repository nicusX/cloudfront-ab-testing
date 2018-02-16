'use strict';

const experimentOriginBucket = 'ab-testing-poc-experiment.s3.amazonaws.com';
const experimentS3Origin = {
    s3: {
        authMethod: 'origin-access-identity',
        domainName: experimentOriginBucket,
        path: '',
        region: 'eu-west-1'    
    }
}

const addCookieHeader = function(headers, cookie) {
    console.log(`Adding cookie header: ${cookie}`);
    headers.cookie = headers.cookie || [];
    headers.cookie.push({ key:'Cookie', value: cookie });
}

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const request = event.Records[0].cf.request;
    const headers = request.headers;

    const cookieMain = 'X-Experiment=main'; 
    const cookieExperimentA = 'X-Experiment=A';        

    let originName;
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {        
            if (headers.cookie[i].value.indexOf(cookieExperimentA) >= 0) {
                console.log('Experiment A cookie found');
                originName = 'experiment';
                break;
            }
            if (headers.cookie[i].value.indexOf(cookieMain) >= 0) {
                console.log('Main cookie found');
                originName = 'main'
                break;
            }            
        }
    } 

    if( !originName ) {
        console.log('Experiment cookie has not been found. Throwing dice...');
        if (Math.random() < 0.5) {
            console.log('Routing to Main');
            originName = 'main';
            addCookieHeader(headers, cookieMain);
        } else {
            console.log('Routing to Experiment');
            originName = 'experiment';
            addCookieHeader(headers, cookieExperimentA);
        }        
    }

    if ( originName === 'experiment' ) {
        console.log('Setting experiment origin');
        headers['host'] = [{key: 'host', value: experimentOriginBucket }];

        request.origin = experimentS3Origin;
    }

    console.log('Request forwarded:', JSON.stringify(request, null, 2));
    callback(null, request);
};


