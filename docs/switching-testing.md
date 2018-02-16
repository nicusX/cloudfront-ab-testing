# Switching A/B testing on and off

How to switch on and off A/B testing without impacting users visiting the website.

Functions are designed to serve the main content by default, but you have to follow the correct sequence 
not to confuse users that are visiting the website.

Obviously, when you are turning off A/B testing, users visiting the Experiment version will suddenly find themselves on the Main version, at some point.

## Turning on A/B testing

1. Preparation
  * Deploy the Experiment content to the Experiment S3 Bucket and make sure the Experiment origin is set up in the CloudFront Distribution
  * Create/Update *Viewer Request*, *Origin Request* and *Origin Response* Lambda functions with correct settings (Experiment Origin, fraction of traffic diverted to Experiment) and execution role
  * Make sure the distribution is fully deployed
2. Attach all three function to the corresponding events in the *Default* behaviour
3. Wait for Distribution to be completely deployed
4. Set Cookie Fowarding for `X-Source` (whitelist) on *Default* Behaviour

When the cookie starts being forwarded, the next request to an Edge Location is an automatic cache miss and it causes loading a new version of the object adding the cookie to the cache key.

From this point, any response to clients contains the `Set-Cookie` header with the value corresponding to the Origin served.

**Tips**

It may be useful to verify the Experiment Origin is correctly configured, before turning on A/B testing.

* Temporarily create and additional behaviour on a subpath and point to the Experiment Origin
* Request an object from the sub-path

Hitting the subpath does not trigger the Lambda@Edge functions attached to the *Default* behaviour.

The test behaviour may be safely removed at any point.


## Turning off A/B testing

1. Stop forwarding `X-Source` cookie on *Default* Behaviour
2. Wait for Distribution to be completely deployed
3. Invalidate the cache
4. (optionally) Detach all functions

When the cookie stops from being propagated, the next request to an Edge Location is an automatic cache miss that causes loading a new version of the object without the cookie in the cache key.

From this point, any cookie coming from clients, or added by the *Viewer Request* function, is ignored.

Detaching functions is optional at this point.

Dataching *Viewer Request* avoid few ms overhead on every request. When no longer forwarded, the cookie added by this function is ignored, regardless.

*Origin Request* and *Origin Response* add a negligible overhead, as they are colled on cache misses only and do not change the request/response as the cookie is no longer forwarded.

