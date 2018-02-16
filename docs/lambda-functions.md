# Lambda functions

**All parameters are currently hardwired in function code**.
As Lambda@Edge does not support runtime environment parameters, they should be injected at compile time.
This part has not been implemented yet.

## Viewer Request

This function processes every request.

Looks for `X-Source` cookie. 
If missing, roll dice and add an `X-Source` cookie to the request, either valued `main` or `experiment`.

The cookie becomes part of the cache key.
If a version of the content for the content from the specified source is already available in the cache, it is considered a Cache Hit.

[Source](../lambda/viewer-request/index.js)


## Origin Request

This function processes only cache misses. 
It allows to replace the Origin to be used.

Looks for `X-Source` cookie.
If present and set to `experiment`, the request *Origin* is replaced with the Experiment S3 bucket.

The `Host` header is also replaced to match the new bucket name. 
If the `Host` header does not match the Origin, CloudFront returns an error: *“The request signature we calculated does not match the signature you provided”*

This function supports **S3 Bucket Origin only**, not Custom origin to S3 Static Website hosting endpoint.
The solution probably works sith Custom origin as well, but I haven't tested it.

[Source](../lambda/origin-request/index.js)


## Origin Response

This function processes responses from an Origin on cache misses.
The resulting response is cached by CloudFront.

If the browser does not have a `X-Source` cookie, it is added to the request by *Viewer Request* Lambda@Edge.
To keep the browser stable on a version we have to set the cookie in the browser.

The response from the Origin is modified, adding a `Set-Cookie` header, setting `X-Source` to the approprirate value, matching the request.

The `Set-Cookie` beconmes part of the cached response.

[Source](../lambda/origin-response/index.js)

## Event Logger

[Source](../lambda/event-logger/index.js)

This function is for troubleshooting only.

It may be attached to any Request or Response trigger to log the event.

Use `index.requestInterceptor` as handler for * Request triggers, and `index.responseInterceptor` for * Response triggers.

[Source](../lambda/event-logger/index.js)
