export interface GmailSettings {
  user_email: string;
  is_connected: boolean;
  connected_gmail?: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: Date;
  last_sync?: Date;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get Gmail settings for user
export const getGmailSettings = async (email: string): Promise<GmailSettings | null> => {
  try {
    const response = await fetch(`${API_URL}/api/gmail-settings/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get Gmail settings');
    }

    return response.json();
  } catch (error) {
    console.error('Get Gmail settings error:', error);
    return null;
  }
};

// Save or update Gmail settings
export const saveGmailSettings = async (settings: GmailSettings): Promise<GmailSettings> => {
  try {
    const response = await fetch(`${API_URL}/api/gmail-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to save Gmail settings');
    }

    return response.json();
  } catch (error) {
    console.error('Save Gmail settings error:', error);
    throw error;
  }
};

// Disconnect Gmail
export const disconnectGmail = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/gmail-settings/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Gmail');
    }
  } catch (error) {
    console.error('Disconnect Gmail error:', error);
    throw error;
  }
};
