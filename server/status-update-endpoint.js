const setupStatusUpdateEndpoint = (app) => {
    // Health check endpoint
    app.get('/api/status', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Server is running'
        });
    });

    // Status update endpoint (if needed for specific functionality)
    app.post('/api/status/update', (req, res) => {
        try {
            // Add your status update logic here
            res.json({
                success: true,
                message: 'Status updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update status',
                error: error.message
            });
        }
    });
};

export default setupStatusUpdateEndpoint;
