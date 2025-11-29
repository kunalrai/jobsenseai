import { UserProfile } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create or update user in database (after Google OAuth)
export const saveUser = async (email: string, name: string, picture: string) => {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, picture }),
    });

    if (!response.ok) {
      throw new Error('Failed to save user');
    }

    return response.json();
  } catch (error) {
    console.error('Save user error:', error);
    throw error;
  }
};

// Get user profile from database
export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_URL}/api/profiles/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null; // Profile doesn't exist yet
    }

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Save user profile to database
export const saveUserProfile = async (email: string, profile: UserProfile) => {
  try {
    const response = await fetch(`${API_URL}/api/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, profile }),
    });

    if (!response.ok) {
      throw new Error('Failed to save profile');
    }

    return response.json();
  } catch (error) {
    console.error('Save profile error:', error);
    throw error;
  }
};

// Delete user profile from database
export const deleteUserProfile = async (email: string) => {
  try {
    const response = await fetch(`${API_URL}/api/profiles/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete profile');
    }

    return response.json();
  } catch (error) {
    console.error('Delete profile error:', error);
    throw error;
  }
};
