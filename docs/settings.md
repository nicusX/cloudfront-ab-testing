# Settings and configuration


## CloudFront 

Two Origins: `main` and `experiment`, pointing to two separate S3 buckets.

Origin names are irrelevant. They do not need to match with names used in `X-Source` cookie.


*Default(*)* behaviour:  
* Forward Cookies: Customize, Whitelist (`X-Source`)
* Cache based on Selected Request Headers: None

Forwarding `X-Source` has two effects:
- Forwards it to the Origin. S3 actually ignores it.
- **Makes the `X-Source` cookie part of the cache key**, along with the object URI

Other Behaviour settings are not relevant. 

Cache TTL may be set to any value.

*Default(*)* behaviour also associates these events to corresponding Lambda functions:
* Viewer Request
* Origin Request
* Origin Response

### Additional, optional settings

I'm currently using these additional settings:

* *Alternate Domain Names (CNAMEs)* pointing a custom domain
* Custom SSL certificate for the custom domain, served by AWS Certificate Manager
* Default Root Object: `index.html`
* Logging on S3 bucket
* Restrict access to both S3 Origins using an *Origin Access Identity*. Don't forget to set S3 Bucket Policy accordingly
* Default behaviour: Redirects HTTP to HTTPS


## IAM

Role for Lambda execution (Role name is irrelevant).

Assign Policy `AWSLambdaBasicExecutionRole` 
or add the following custom policy:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
```

All lambdas must use this role as Execution Role