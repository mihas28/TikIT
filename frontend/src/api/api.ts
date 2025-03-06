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
export const fetchGroups = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/groups', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /groups:', error);
    throw error;
  }
};

// **Funkcija za posodobitev podatkov skupine**
export const updateGroup = async (groupId: number, updatedData: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/groups/${groupId}`, updatedData, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri posodabljanju skupine (ID: ${groupId}):`, error);
    throw error;
  }
};

// **Funkcija za dodajanje nove skupine**
export const createGroup = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.post(`http://localhost:3000/groups/`, data, {
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

// **Funkcija za pridobivanje podatkov iz /contract**
export const fetchContracts = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/contract', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /groups:', error);
    throw error;
  }
};

// **Funkcija za posodobitev podatkov pogodbe**
export const updateContract = async (contractId: number, updatedData: Record<string, any>, file?: File) => {
  try {
      const authStore = useAuthStore();
      const formData = new FormData();

      // **Dodamo tekstovne podatke**
      formData.append('company_id', updatedData.company_id);
      formData.append('short_description', updatedData.short_description);
      formData.append('description', updatedData.description);
      formData.append('start_date', updatedData.start_date);
      formData.append('end_date', updatedData.end_date);
      formData.append('state', updatedData.state);

      // **Preverimo, ali obstaja nova datoteka in jo dodamo**
      if (file) {
          formData.append('contract_file', file, file.name);
      }

      const response = await axios.put(`http://localhost:3000/contract/${contractId}`, formData, {
          headers: {
              Authorization: `Bearer ${authStore.accessToken}`,
              'Content-Type': 'multipart/form-data', // Nastavimo pravilno vsebino za prenos datoteke
          },
      });

      return response.data;
  } catch (error) {
      console.error(`Napaka pri posodabljanju pogodbe (ID: ${contractId}):`, error);
      throw error;
  }
};

// **Funkcija za dodajanje nove pogodbe**
export const addContract = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    
    // Ustvarimo FormData objekt
    const formData = new FormData();
    
    // Dodamo vse podatke v FormData
    formData.append('company_id', data.company_id);
    formData.append('short_description', data.short_description);
    formData.append('description', data.description);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('state', data.state);
    
    // Dodamo datoteko (preverimo ali obstaja)
    if (data.contract_file) {
      formData.append('contract_file', data.contract_file);
    }

    // Pošljemo FormData preko axiosa
    const response = await axios.post(`http://localhost:3000/contract`, formData, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'multipart/form-data', 
      },
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const openContractFile = async (contractId: number) => {
  try {
    const authStore = useAuthStore();
    const response = await fetch(`http://localhost:3000/contract/${contractId}/file`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Napaka pri pridobivanju pogodbe.');
    }

    const blob = await response.blob();
    const fileURL = URL.createObjectURL(blob);

    // Odpri PDF v novem zavihku
    window.open(fileURL, '_blank');
  } catch (error) {
    console.error('Napaka pri odpiranju pogodbe:', error);
  }
};
