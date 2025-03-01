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
