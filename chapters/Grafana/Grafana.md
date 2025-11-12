# Grafana

Grafana is an open-source platform for visualizing and exploring time-series data (and more).
It connects to many data sources—Prometheus, Loki, Tempo, Elasticsearch, InfluxDB, PostgreSQL, ClickHouse, CloudWatch, etc.—and lets you build interactive dashboards, set alerts, and share reports.

**How it fits with Prometheus**
* Prometheus scrapes/stores metrics; Grafana queries and visualizes them with PromQL.
* Common stack: Prometheus (metrics) + Loki (logs) + Tempo (traces) + Grafana → one UI to pivot between signals.

## Configuration

You will find a `grafana.ini` file in `/etc/grafana`, in which you can configure different aspects.

It's recommended to create a copy when editing it - for example, `custom.ini`.

If you want to keep your data in an external database, then you can configure that in the `.ini` file.

## Example

Run the docker compose file in `chapters/Grafana/examples/docker-compose.yml`:
```bash
docker compose up -d
```

Push a sample metric for Pushgateway:
```bash
echo "demo_job_duration_seconds 2.5" | curl --data-binary @- http://localhost:9091/metrics/job/demo/instance/local
```

Or use the Node helper.
```bash
node ./helpers/pushData.js
```

Query with: `demo_job_duration_seconds{job="demo",instance="local"}`

