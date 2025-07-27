import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../auth';
import { checkTier } from '../middleware/tier-check';

const router = Router();

// Mock integration data
const mockIntegrations = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    status: 'disconnected',
    category: 'calendar',
    tier: 'pro',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    status: 'disconnected',
    category: 'communication',
    tier: 'pro',
  },
  {
    id: 'github',
    name: 'GitHub',
    status: 'connected',
    category: 'development',
    tier: 'advanced',
    lastSync: new Date(),
  },
  {
    id: 'slack',
    name: 'Slack',
    status: 'disconnected',
    category: 'communication',
    tier: 'advanced',
  },
  {
    id: 'trello',
    name: 'Trello',
    status: 'error',
    category: 'productivity',
    tier: 'pro',
  },
];

const mockWebhooks = [
  {
    id: '1',
    name: 'Task Completion Webhook',
    url: 'https://api.example.com/task-completed',
    events: ['task.completed', 'task.updated'],
    active: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Daily Summary',
    url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef',
    events: ['daily.summary'],
    active: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
];

// Get all available integrations
router.get('/', authenticateToken, checkTier('basic_pro'), async (req: AuthRequest, res) => {
  try {
    res.json({ 
      integrations: mockIntegrations,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch integrations',
      success: false 
    });
  }
});

// Connect to an integration
router.post('/:integrationId/connect', authenticateToken, checkTier('basic_pro'), async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    const config = req.body;

    // Find the integration
    const integration = mockIntegrations.find(i => i.id === integrationId);
    
    if (!integration) {
      return res.status(404).json({ 
        error: 'Integration not found',
        success: false 
      });
    }

    // Mock connection logic
    integration.status = 'connected';
    integration.lastSync = new Date();

    res.json({ 
      integration,
      message: `Successfully connected to ${integration.name}`,
      success: true 
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ 
      error: 'Failed to connect integration',
      success: false 
    });
  }
});

// Disconnect an integration
router.post('/:integrationId/disconnect', authenticateToken, checkTier('basic_pro'), async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;

    const integration = mockIntegrations.find(i => i.id === integrationId);
    
    if (!integration) {
      return res.status(404).json({ 
        error: 'Integration not found',
        success: false 
      });
    }

    integration.status = 'disconnected';
    delete integration.lastSync;

    res.json({ 
      integration,
      message: `Successfully disconnected from ${integration.name}`,
      success: true 
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect integration',
      success: false 
    });
  }
});

// Get webhooks
router.get('/webhooks', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    res.json({ 
      webhooks: mockWebhooks,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch webhooks',
      success: false 
    });
  }
});

// Create webhook
router.post('/webhooks', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { name, url, events = ['task.completed'] } = req.body;

    if (!name || !url) {
      return res.status(400).json({ 
        error: 'Name and URL are required',
        success: false 
      });
    }

    const newWebhook = {
      id: Date.now().toString(),
      name,
      url,
      events,
      active: true,
      createdAt: new Date(),
    };

    mockWebhooks.push(newWebhook);

    res.json({ 
      webhook: newWebhook,
      success: true 
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ 
      error: 'Failed to create webhook',
      success: false 
    });
  }
});

// Update webhook
router.put('/webhooks/:webhookId', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { webhookId } = req.params;
    const updates = req.body;

    const webhookIndex = mockWebhooks.findIndex(w => w.id === webhookId);
    
    if (webhookIndex === -1) {
      return res.status(404).json({ 
        error: 'Webhook not found',
        success: false 
      });
    }

    mockWebhooks[webhookIndex] = { ...mockWebhooks[webhookIndex], ...updates };

    res.json({ 
      webhook: mockWebhooks[webhookIndex],
      success: true 
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ 
      error: 'Failed to update webhook',
      success: false 
    });
  }
});

// Delete webhook
router.delete('/webhooks/:webhookId', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
  try {
    const { webhookId } = req.params;

    const webhookIndex = mockWebhooks.findIndex(w => w.id === webhookId);
    
    if (webhookIndex === -1) {
      return res.status(404).json({ 
        error: 'Webhook not found',
        success: false 
      });
    }

    mockWebhooks.splice(webhookIndex, 1);

    res.json({ 
      message: 'Webhook deleted successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ 
      error: 'Failed to delete webhook',
      success: false 
    });
  }
});

// Sync integration data
router.post('/:integrationId/sync', authenticateToken, checkTier('basic_pro'), async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;

    const integration = mockIntegrations.find(i => i.id === integrationId);
    
    if (!integration) {
      return res.status(404).json({ 
        error: 'Integration not found',
        success: false 
      });
    }

    if (integration.status !== 'connected') {
      return res.status(400).json({ 
        error: 'Integration is not connected',
        success: false 
      });
    }

    // Mock sync operation
    integration.lastSync = new Date();

    // Simulate synced data
    const syncedData = {
      itemsImported: Math.floor(Math.random() * 10) + 1,
      itemsUpdated: Math.floor(Math.random() * 5),
      lastSync: integration.lastSync,
    };

    res.json({ 
      integration,
      syncData: syncedData,
      message: `Successfully synced ${syncedData.itemsImported} items from ${integration.name}`,
      success: true 
    });
  } catch (error) {
    console.error('Error syncing integration:', error);
    res.status(500).json({ 
      error: 'Failed to sync integration',
      success: false 
    });
  }
});

export default router;