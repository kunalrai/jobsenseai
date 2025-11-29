import { EmailMessage } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get all user emails from database
export const getUserEmails = async (email: string): Promise<EmailMessage[]> => {
  try {
    const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get emails');
    }

    return response.json();
  } catch (error) {
    console.error('Get emails error:', error);
    return [];
  }
};

// Sync emails to database (bulk save)
export const syncEmails = async (email: string, emails: EmailMessage[]) => {
  try {
    const response = await fetch(`${API_URL}/api/emails/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, emails }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync emails');
    }

    return response.json();
  } catch (error) {
    console.error('Sync emails error:', error);
    throw error;
  }
};

// Save single email to database
export const saveEmail = async (email: string, emailData: EmailMessage) => {
  try {
    const response = await fetch(`${API_URL}/api/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, emailData }),
    });

    if (!response.ok) {
      throw new Error('Failed to save email');
    }

    return response.json();
  } catch (error) {
    console.error('Save email error:', error);
    throw error;
  }
};

// Get emails by category
export const getEmailsByCategory = async (email: string, category: string): Promise<EmailMessage[]> => {
  try {
    const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/category/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get emails by category');
    }

    return response.json();
  } catch (error) {
    console.error('Get emails by category error:', error);
    return [];
  }
};

// Mark email as read
export const markEmailAsRead = async (email: string, emailId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/${encodeURIComponent(emailId)}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark email as read');
    }

    return response.json();
  } catch (error) {
    console.error('Mark email as read error:', error);
    throw error;
  }
};

// Delete single email
export const deleteEmail = async (email: string, emailId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/${encodeURIComponent(emailId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete email');
    }

    return response.json();
  } catch (error) {
    console.error('Delete email error:', error);
    throw error;
  }
};

// Delete all user emails
export const deleteAllEmails = async (email: string) => {
  try {
    const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete all emails');
    }

    return response.json();
  } catch (error) {
    console.error('Delete all emails error:', error);
    throw error;
  }
};
