# Introduction

## What is monitoring?

Monitoring is collecting and visualising data about systems regularly so the system's health can be viewed and tracked.

The data that is collected for monitoring is called Telemetry Data.

Telemetry Data is used to find where the problem might be.

### Metrics used to measure the DevOps success:

#### Mean Time to Detection (MTTD)

MTTD is the amount of time, on average, between the start of an issue and when teams become aware of it.

#### Mean time to resolve (MTTR)

MTTR is the average amount of time between when an issue is detected, and when systems are fixed and operating normally.

## What metrics to collect

Any microservices based application usually has three layers:
* UI layer
* Service layer
* Infrastructure layer

There are Core Web Vitals to monitor the UI layer.
* Largest contentful paint (Perceived page load)
* First input delay (perceived responsiveness)
* Cumulative layout shift (Perceived stability)

Core Web Vitals are important for SEO.

RED method (Request oriented) for the service layer.
* Rate (throughput) - Request per second
* Errors - Failed requests
* Duration - latency or transaction response time.

USE method (Resource oriented) for the infrastructure layer.
* Utilization - CPU usage, disk space, etc
* Saturation - network queue length. Zero = good
* Errors - disk write error. Zero = good

And the Four Golden Signals, which cover the service and infrastructure layers.
Basically RED + S.
* Latency
* Traffic
* Errors
* Saturation

## What is observability?

Monitoring is part of observability.

To use monitoring, we need to know what to monitor in advance.

Observability is gathering actionable data in a way that gives a holistic view of the entire system, and tells us where, when, and why an issue occurs.

In observability, we make sense of different types of metrics and data collected from various parts of the system.

### What types of telemetry data do we collect?

Remember it as MELT.
* Metric
  * An aggregated value representing events in a period of time.
  * Metrics are great for comparing the performance of the system with a time in the past.
* Event
  * Events can be found in Event Streaming platforms, e.g. Kafka.
  * Events validate that an expected action happened.
* Log
  * A very detailed representation of an event.
* Trace
  * Shows the interactions of microservices to fulfil a request.

### Methods of collecting metrics

There are two methods - push and scrape.

#### Push method

Applications and microservices send the metrics to an endpoint.

Example of push is an application sending metrics to StatsD, to be stored on Graphite.

#### Scrape method

Applications and microservices provide APIs for the time series database, to read the metrics.

Example of Scrape method is Prometheus scraping metrics.

#### Choice

Choosing between push and scrape comes down to your application.

* Metrics (service → time-series DB): default to scrape (pull) if you can (Prometheus style).
* Logs & traces: almost always push.
* Edge/ephemeral/serverless/mobile/IOT: often push via a local agent/collector.
* In mixed estates, use a hybrid: agents push to a collector, then your TSDB scrapes the collector or the collector pushes onward.

##### Pull (scrape) model — when it shines
How it works: the backend (e.g., Prometheus) periodically fetches /metrics from targets.

**Pros**
* Backpressure & reliability: if the TSDB is overloaded, it just scrapes less often; targets don’t block.
* One point for auth/TLS: central place manages mTLS/ACLs.
* Target truth: scrape can include liveness (if endpoint is down, you know).
* Lower blast radius: a bad target can’t flood the TSDB.

**Cons**
* Network reachability required: scrapers must reach targets (NAT, firewalls, private subnets complicate it).
* Ephemeral/short-lived jobs: may start/finish between scrapes.
* Non-HTTP or client-only environments: browsers/mobile devices can’t be scraped.

**Use pull when**
* You control the network (Kubernetes, service discovery available).
* Workloads are long-running and expose HTTP endpoints.
* You want the Prometheus ecosystem simplicity and cardinality guardrails.

##### Push model — when it shines
How it works: agents/exporters send data to a collector/TSDB endpoint.

**Pros**
* Works through NAT/outbound-only networks (edge, branch, mobile).
* Great for batch/short-lived jobs (send on finish).
* Buffering/retries: agents can queue while backend is down.
* Fan-in: easy to gateway multi-tenant or remote sites.

**Cons**
* Backpressure is harder: misconfigured clients can overwhelm backend.
* Auth & multi-tenant security pushed to the edge (tokens, mTLS). 
* Data trust: you can’t tell if a dead target is missing vs just silent without heartbeats.

**Use push when**
* Targets can’t be scraped (serverless, jobs, client apps, IoT).
* You want centralized collectors (OpenTelemetry Collector, Vector, Fluent Bit) to normalize and forward.

##### By signal type
* Metrics: Prefer pull (Prometheus). For things that can’t be scraped, use:
  * PushGateway (for batch jobs finishing quickly) — but not for long-running services. 
  * Sidecar/DaemonSet collectors that push to a central Prometheus Remote Write endpoint or to an Otel Collector which the TSDB scrapes.
* Logs: Always push (Fluent Bit/Vector/Filebeat → log store).
* Traces: Push via OTLP to an OpenTelemetry Collector or tracing backend.

##### Common patterns (what most shops end up with)
* Kubernetes cluster
  * Apps expose /metrics; Prometheus scrapes via service discovery. 
  * Node/system metrics via exporters (node-exporter, kube-state-metrics) scraped. 
  * A cluster-local OpenTelemetry Collector receives push traces/logs and can also receive metrics via OTLP and remote_write to TSDB or be scraped by Prometheus.
* Edge sites / private networks 
  * Run a local collector/agent (Otel Collector/Telegraf/Vector) that pushes over HTTPS to your central observability endpoint. Prometheus may scrape the local collector (one ingress point) rather than every device.
* Batch/serverless 
  * On completion, job/function pushes a final metric set (OTLP/StatsD/PushGateway) and logs/traces to a collector.

##### Decision checklist
* Can the backend reach the target? 
  * Yes → scrape.
  * No/NAT/outbound-only → push (via agent/collector).
* Workload lifetime:
  * Long-running → scrape
  * Short-lived/batch → push.
* Signal type:
  * Logs & traces → push.
  * Metrics → scrape by default.
* Cardinality & control:
  * Worried about clients spamming?
    * Scrape centralizes control
    * Push requires rate limits and quotas at the edge/collector.
* Ops model:
  * If you already run Prometheus, keep metrics pull
  * Add a collector tier for everything that must push.

##### Concrete choices & tools
* Pull: Prometheus/Thanos/Mimir scraping /metrics (OpenMetrics/Prom exposition).
* Push metrics: OpenTelemetry Collector (OTLP), Prometheus remote_write, StatsD/Telegraf.
* Logs: Fluent Bit / Vector → Loki/Elastic/OpenSearch.
* Traces: OTLP → Tempo/Jaeger/Zipkin.

##### Practical recommendations
* Default: Scrape metrics; push logs/traces.
* For “can’t be scraped” cases: deploy a collector on the same host/cluster to accept push, then forward/remote_write.
* Batch jobs: use PushGateway only for short-lived jobs; for everything else, instrument normal /metrics.
* Guardrails for push: enforce auth (mTLS/bearer), rate limits, and backpressure at collectors; use local disk buffers for outages.
* Measure tail latency & loss: add heartbeats so you can detect silent data loss from push paths.