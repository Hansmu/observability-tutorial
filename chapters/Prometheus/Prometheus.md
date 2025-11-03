# Prometheus

Prometheus is an open-source monitoring and time-series database built for cloud-native systems.

**What it does**
* Scrapes metrics from targets over HTTP (pull model) at intervals. 
* Stores them as time series: metric_name{label="value", ...} -> samples over time. 
* Lets you query with PromQL (e.g., rates, sums, percentiles). 
* Generates alerts (Prometheus → Alertmanager) and recording rules (precomputed series).

**Core pieces**
* Prometheus server - scraping, TSDB, PromQL engine.
* Exporters - expose /metrics (e.g., node_exporter, app SDKs).
* Alertmanager - dedup/route/notify on alert rules.
* Pushgateway (optional) - for short-lived jobs to push metrics.
* Service discovery - finds targets (Kubernetes, EC2, files, etc.).

**What it’s not**
* Not a log store or tracing system (pair with Loki/Elastic; Tempo/Jaeger/OTel for traces).

Use Prometheus to observe service health, latency, throughput, errors, and trigger alerts when SLOs are at risk.

## Operating Prometheus

You can run Prometheus with Docker using:

```bash
docker run --name prometheus -d -p 127.0.0.1:9090:9090 prom/prometheus
```

### Collecting data and metrics

When we have the source code of the application, then we can send the metrics easily.

However, if we do not have it, then we need an exporter. For example, we want metrics out of MySQL.

Or if there are so many devices they could accidentally DDOS your Prometheus.

The process of Prometheus pulling in the metrics, as opposed to them being sent to it, is called scraping/pulling.

Prometheus has a configurable property, so that every N seconds it'll pull the data.

If data is pushed to Prometheus, then it'll hit the Push Gateway, which acts as temporary storage, which has a built-in exporter.

So regardless of how data is being sent, then Prometheus will always pull.

### Node exporter (Linux)

Node Exporter is an official Prometheus exporter for collecting metrics that are exposed by Unix-based kernels. E.g. Linux and Ubuntu.

Example of metrics are CPU, Disk, Memory, and Network I/O.

Node Exporter can be extended with pluggable metric collectors.

Run the example:
```bash
docker compose up --build -d
```

Validate in the Prometheus query that data is coming through:
```
up{job="ubuntu-node"}
```

![Example showing up{job="ubuntu-node"} returning 1](images/up-example.png)

In order to see the shape of the data that is actually being exported:
```bash
docker compose exec ubuntu-node sh -lc 'curl -s http://localhost:9100/metrics | head -n 40'
```

Example snippet of the data:
```
# HELP go_gc_duration_seconds A summary of the wall-time pause (stop-the-world) duration in garbage collection cycles.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 1.683e-05
go_gc_duration_seconds{quantile="0.25"} 3.0344e-05
go_gc_duration_seconds{quantile="0.5"} 3.845e-05
go_gc_duration_seconds{quantile="0.75"} 5.3504e-05
go_gc_duration_seconds{quantile="1"} 0.000572157
go_gc_duration_seconds_sum 0.004976475
go_gc_duration_seconds_count 104
```

Lines starting with # HELP/# TYPE are metadata.

Each metric line is name{label="value",...} number.
* However, the labels that are added will be in addition to default ones.
* Prometheus itself will add a bunch of labels by default.
* So in the above example, it doesn't mean that `go_gc_duration_seconds_count` has no properties to filter on. 

To see the entire configuration of your Prometheus instance, you can go into Status -> Configuration.

Notice, that there are a lot more properties there than are listed in our file.

This is because our file allows for partial overriding, while the defaults remain.

![Example showing full Prometheus configuration file](images/prometheus-configuration-file.png)

You can check what kind of scrapers are defined in the above, or by going to Status -> Service discovery.

![Example showing service groups for Prometheus](examples/service-groups.png)