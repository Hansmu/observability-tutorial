const URL = "http://localhost:9091/metrics/job/demo/instance/local";

const SENDING_INTERVAL_MS = 500;

/**
 * A numeric range with optional decimal precision.
 * @typedef {Object} NumericRange
 * @property {number} min
 * @property {number} max
 * @property {number} [precision] - Number of decimal places to use.
 */

/**
 * Map of label names to either an allowed set of string values
 * or a numeric range (for numeric labels like price).
 * @typedef {{ [label: string]: string[] | NumericRange }} LabelMap
 */

/**
 * One metric definition.
 * @typedef {Object} Metric
 * @property {string} name                 - Metric name (e.g., "product_sold").
 * @property {LabelMap} labels             - Label definitions for this metric.
 * @property {NumericRange} value          - Range for the metric's value.
 */

/** @type {Metric[]} */
const METRICS = [
    {
        name: 'product_sold',
        labels: {
            region: ["US", "EU", "Asia"],
            product: ["shoes", "pants", "gloves"]
        },
        value: {
            min: 50,
            max: 15_000,
            precision: 3,
        }
    },
    {
        name: 'response_time',
        labels: {
            endPoint: ["BUY", "SELL", "GET"]
        },
        value: {
            min: 15,
            max: 450,
            precision: 0,
        }
    },
    {
        name: 'order_processing_time_ms',
        labels: {
            region: ["US", "EU", "Asia"],
            product: ["shoes", "pants", "gloves"]
        },
        value: {
            min: 200,
            max: 4_000,
            precision: 0,
        }
    }
];

let running = true;
process.on("SIGINT", () => {
    running = false;
    console.log("\nExiting.");
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isDefined = (val) => val !== undefined && val !== null;

const randomizeValue = (label, valueSet) => {
    if (isDefined(valueSet.min) && isDefined(valueSet.max) && isDefined(valueSet.precision)) {
        const v = valueSet.min + Math.random() * (valueSet.max - valueSet.min);
        return Number(v.toFixed(valueSet.precision));
    }

    if (Array.isArray(valueSet)) {
        return valueSet[Math.floor(Math.random() * valueSet.length)];
    }

    throw new Error(`Unknown randomization sequence for ${label}`);
};

const buildMetric = ({ metric, labels, value }) => {
    const entries = Object.entries(labels);
    const randomMetricValue = randomizeValue(metric, value);

    if (entries.length === 0) {
        return `${metric} ${randomMetricValue}`;
    }

    const stringifiedLabels = entries.map(([labelName, labelValueSet]) => {
        const randomLabelValue = randomizeValue(labelName, labelValueSet);
        return `${labelName}="${randomLabelValue}"`;
    });
    const joinedLabels = stringifiedLabels.join(",");
    return `${metric}{${joinedLabels}} ${randomMetricValue}`;
};

const pushMetric = async (metric) => {
    const body = `${metric}\n`;

    console.log(body);
    try {
        const res = await fetch(URL, {
            method: "POST",
            headers: {"Content-Type": "text/plain;"},
            body,
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        console.log(`[${new Date().toISOString()}] sent: ${metric}`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ERROR: ${String(err)}`);
    }
};

(async () => {
    while (running) {
        await Promise.all(
            METRICS.map(metric => {
                const metricDefinition = buildMetric({
                    metric: metric.name,
                    labels: metric.labels,
                    value: metric.value
                });
                return pushMetric(metricDefinition);
            })
        );
        await sleep(SENDING_INTERVAL_MS);
    }
})();
