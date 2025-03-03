import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// **Funkcija za pridobivanje podatkov iz /company**
export const fetchCompanyData = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/company', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /company:', error);
    throw error;
  }
};

// **Funkcija za posodobitev podatkov uporabnika**
export const updateUser = async (companyId: number, updatedData: Record<string, any>) => {
    try {
      const authStore = useAuthStore();
      const response = await axios.put(`http://localhost:3000/users/${companyId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Napaka pri posodabljanju podjetja (ID: ${companyId}):`, error);
      throw error;
    }
  };

  // **Funkcija za posodobitev gesla uporabnika**
export const updatePassword = async (userId: number, updatedData: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/users/password/admin/reset/${userId}`, JSON.stringify({ updatedData }), {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri posodabljanju gesla (ID: ${userId}):`, error);
    throw error;
  }
};

  // **Funkcija za dodajanje novega podjetja**
export const createCompany = async (data: Record<string, any>) => {
    try {
      const authStore = useAuthStore();
      const response = await axios.post(`http://localhost:3000/company/`, data, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // **Funkcija za pridobivanje podatkov iz /users**
export const fetchUsers = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/users', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /company:', error);
    throw error;
  }
};

// **Funkcija za posodobitev podatkov podjetja**
export const updateCompany = async (companyId: number, updatedData: Record<string, any>) => {
    try {
      const authStore = useAuthStore();
      const response = await axios.put(`http://localhost:3000/company/${companyId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Napaka pri posodabljanju podjetja (ID: ${companyId}):`, error);
      throw error;
    }
  };

  // **Funkcija za dodajanje novega uporabnika**
export const createUser = async (data: Record<string, any>) => {
    try {
      const authStore = useAuthStore();
      const response = await axios.post(`http://localhost:3000/users/`, data, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

// **Funkcija za pridobivanje podatkov iz /groups**
export const fetchGroupData = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/groups', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /company:', error);
    throw error;
  }
};