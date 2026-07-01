const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');

const app = express();
const docker = new Docker();

app.use(cors());
app.use(express.json());

// List all containers
app.get('/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json(containers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start container
app.post('/containers/:id/start', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.start();
        res.json({ message: 'Container started successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stop container
app.post('/containers/:id/stop', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.stop();
        res.json({ message: 'Container stopped successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Restart container
app.post('/containers/:id/restart', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.restart();
        res.json({ message: 'Container restarted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get container logs
app.get('/containers/:id/logs', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail: 100,
            follow: false
        });
        res.send(logs.toString());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get container CPU & RAM stats
app.get('/containers/:id/stats', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const stats = await container.stats({ stream: false });

        // Calculate CPU usage percentage
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpuCount = stats.cpu_stats.online_cpus || 1;
        const cpuPercent = systemDelta > 0 ? ((cpuDelta / systemDelta) * cpuCount * 100).toFixed(2) : 0;

        // Calculate Memory usage
        const memUsage = stats.memory_stats.usage || 0;
        const memLimit = stats.memory_stats.limit || 1;
        const memPercent = ((memUsage / memLimit) * 100).toFixed(2);
        const memUsageMB = (memUsage / (1024 * 1024)).toFixed(2);
        const memLimitMB = (memLimit / (1024 * 1024)).toFixed(2);

        res.json({
            cpuPercent: parseFloat(cpuPercent),
            memPercent: parseFloat(memPercent),
            memUsageMB: parseFloat(memUsageMB),
            memLimitMB: parseFloat(memLimitMB)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
});