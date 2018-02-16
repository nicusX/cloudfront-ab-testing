# Server-side A/B testing with CloudFront & Lambda@Edge

Scratch code for experimenting with Lambda@Edge for implementing A/B testing on CloudFront, serving a static website from S3.

**This is a WIP. Far from a working solution**.

Many parts of the solution are still manual and missing from this code.

## Scenario

You have a website or any static content.

Static content served by an S3 bucket.
Serving the content by S3 is not actually a contraint. The real constraint is the system seving the content does not handle cookies and has no intelligence for handling separate versions of the content, or you do not want to/cannnot modify it to support testing of multiple versions.

Content is cached by AWS CloudFront CDN.

Your goal is doing A/B testing or Canary deployment testing: part of the traffic is diverted to a different version. For proper A/B testing is 50-50%, but may be any fraction.

You are testing between two (or more) different, **complete** versions of the entire content (not a single element, e.g. the image of the logo).
Let's call them *main* and *experiment*. There might be multiple experiments as an extention.

Each version of the website is served by a separate URL (e.g. a separate S3 Bucket). They are configured as different *Origins* in the CloudFormation Distribution.

You want to have a user sticking on the same version of content for the duration of her/his "browser" session(remember there is no login.
You do not want to have content randomly served from diferent versions at each request.

## Reference documentation and examples

Documentation is quite sparse. Examples are naive.

### Docs

* [AWS Lambda Developer Guide - Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html)
* [AWS CloudFront Developer Guide - Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)


### Examples

* [AWS Lambda@Edge docs - Example: A/B Testing](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html#lambda-examples-a-b-testing)
* [Dynamically Route Viewer Requests to Any Origin Using Lambda@Edge](https://aws.amazon.com/blogs/networking-and-content-delivery/dynamically-route-viewer-requests-to-any-origin-using-lambdaedge/)
* [How to supercharge your static website with the power of AWS Lambda@Edge](https://read.acloud.guru/supercharging-a-static-site-with-lambda-edge-da5a1314238b)


### Known Issues

[Replicated Lambda@Edge cannot be deleted](https://forums.aws.amazon.com/thread.jspa?threadID=260242) (i.e. Lambda associated with CloudFront Distributions as Lambda@Edge).

You have to remove the trigger from the CF Distribution first. Then, you have to wait until the Lambda is completely removed from the CDN (it took about 24 hrs for me) before being able to delete the Lambda.

AFAIK there is no way to know the state of Lambda distribution, by AWS CLI or Console. So just wait and retry...

Note that this issue practically prevents from using any stateful infrastructure automation tool, like [Terraform](https://github.com/terraform-providers/terraform-provider-aws/issues/1721) or CloudFormation, to deploy Lamda@Edge.

## How it should work

The goal is keeping the served version stable with `X-Source` cookie. 
As content is served by S3 bucket the cookie cannot be added by the server.

### CloudFront Distribution

Two Origins: `main` and `experiment`, pointing to two different S3 buckets.
Note that Origin names are irrelevant. They do not need to match with names used in `X-Source` cookie.

*Default(*)* Behaviour:  Forward Cookies = Whitelist (`X-Source`).

Forwarding `X-Source` has two effects:
- Forwards it to the Origin. S3 actually ignores it.
- **Makes the `X-Source` cookie part of the cache key**, along with the object URI

Other Behaviour settings are not relevant. Cache TTL may be set to any value.


**TODO** Verify if the `experiment` Origin must be specified in Distribution config.

### Lambda@Edge

The following Lambdas must be associated to the *Default* Behaviour of the CF Distribution:

#### Viewer Request

This Lambda processes every request.

Looks for `X-Source` cookie. 
If missing, roll dice and add an `X-Source` cookie to the request, either valued `main` or `experiment`.

The cookie becomes part of the cache key.
If a version of the content for the content from the specified source is already available in the cache, it is considered a Cache Hit.

#### Origin Request

This Lambda processes only cache misses. 
It allows to replace the Origin to be used.

Looks for `X-Source` cookie.
If present and set to `experiment`, the request *Origin* is replaced with the Experiment S3 bucket.

The `Host` header is also replaced to match the new bucket name. 
If the `Host` header does not match the Origin, CloudFront returns an error: *“The request signature we calculated does not match the signature you provided”*

#### Origin Response

This Lambda processes responses from an Origin on cache misses.
The resulting response is cached by CloudFront.

If the browser does not have a `X-Source` cookie, it is added to the request by *Viewer Request* Lambda@Edge.
To keep the browser stable on a version we have to set the cookie in the browser.

The response from the Origin is modified, adding a `Set-Cookie` header, setting `X-Source` to the approprirate value, matching the request.

The `Set-Cookie` beconmes part of the cached response.
