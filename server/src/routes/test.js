import express from 'express';
import { testDatabaseConnection, testDatabaseConfig, testRailwayFeatures } from '../utils/databaseTester.js';

const router = express.Router();

// GET /api/test/database - Test database connection
router.get('/database', async (req, res) => {
  try {
    const connectionResults = await testDatabaseConnection();
    const configResults = await testDatabaseConfig();
    const railwayResults = await testRailwayFeatures();

    const allResults = [
      ...connectionResults,
      ...configResults,
      ...railwayResults
    ];

    const successCount = allResults.filter(r => r.status === 'SUCCESS').length;
    const failedCount = allResults.filter(r => r.status === 'FAILED').length;
    const overallStatus = failedCount === 0 ? 'HEALTHY' : 'ISSUES_DETECTED';

    res.json({
      success: true,
      message: 'Database test completed',
      data: {
        overall_status: overallStatus,
        summary: {
          total_tests: allResults.length,
          passed: successCount,
          failed: failedCount,
          warnings: allResults.filter(r => r.status === 'WARNING').length
        },
        results: allResults,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/test/health - Comprehensive health check
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      server: {
        status: 'OK',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      database: {
        status: 'CHECKING...'
      },
      environment: {
        node_version: process.version,
        node_env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000
      }
    };

    // Quick database check
    try {
      const dbResults = await testDatabaseConnection();
      const dbFailures = dbResults.filter(r => r.status === 'FAILED').length;
      healthStatus.database = {
        status: dbFailures === 0 ? 'OK' : 'ISSUES',
        tests_passed: dbResults.filter(r => r.status === 'SUCCESS').length,
        tests_failed: dbFailures
      };
    } catch (error) {
      healthStatus.database = {
        status: 'ERROR',
        error: error.message
      };
    }

    const overallHealthy = healthStatus.database.status === 'OK';

    res.status(overallHealthy ? 200 : 503).json({
      success: overallHealthy,
      message: overallHealthy ? 'System healthy' : 'System issues detected',
      data: healthStatus
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/test/endpoints - Test all API endpoints
router.get('/endpoints', async (req, res) => {
  try {
    const endpointTests = [
      { path: '/health', method: 'GET', expected_status: 200 },
      { path: '/api/packages', method: 'GET', expected_status: [200, 401] },
      { path: '/api/achievements', method: 'GET', expected_status: [200, 401] },
      { path: '/api/coaches', method: 'GET', expected_status: [200, 401] },
      { path: '/api/auth/register', method: 'POST', expected_status: [400, 422] }, // No body = validation error
    ];

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    const results = [];

    for (const test of endpointTests) {
      try {
        const response = await fetch(`${baseUrl}${test.path}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const expectedStatuses = Array.isArray(test.expected_status) 
          ? test.expected_status 
          : [test.expected_status];

        const isExpected = expectedStatuses.includes(response.status);

        results.push({
          endpoint: `${test.method} ${test.path}`,
          status: isExpected ? 'SUCCESS' : 'UNEXPECTED',
          http_status: response.status,
          expected: expectedStatuses,
          message: isExpected ? 'Response as expected' : `Expected ${expectedStatuses}, got ${response.status}`
        });

      } catch (error) {
        results.push({
          endpoint: `${test.method} ${test.path}`,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    const passedTests = results.filter(r => r.status === 'SUCCESS').length;

    res.json({
      success: true,
      message: 'Endpoint tests completed',
      data: {
        summary: {
          total_endpoints: results.length,
          passed: passedTests,
          failed: results.length - passedTests
        },
        results,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Endpoint test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
