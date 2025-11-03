# Ubuntu container with node_exporter baked in
FROM ubuntu:22.04

# Install basics, create user
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -r -s /bin/false nodeexp

# Set node_exporter version
ARG NE_VER=1.10.2
WORKDIR /opt/node_exporter

# Download and verify (basic)
# https://github.com/prometheus/node_exporter
RUN curl -fsSL -o ne.tar.gz \
      https://github.com/prometheus/node_exporter/releases/download/v${NE_VER}/node_exporter-${NE_VER}.linux-amd64.tar.gz \
 && tar -xzf ne.tar.gz --strip-components=1 \
 && rm ne.tar.gz \
 && chown -R nodeexp:nodeexp /opt/node_exporter

USER nodeexp
EXPOSE 9100

# Run node_exporter (container metrics — not the host)
ENTRYPOINT ["/opt/node_exporter/node_exporter"]
# You can pass extra flags via docker-compose if desired, e.g. --collector.textfile.directory
