import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { ca } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL;

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

////////////////////////

// **Funkcija za pridobivanje podatkov iz /company/essential**
export const fetchCompanyDataCreate = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/company/essential', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /company/essential:', error);
    throw error;
  }
};

  // **Funkcija za pridobivanje podatkov iz /users/essential**
  export const fetchUsersCreate = async () => {
    try {
      const authStore = useAuthStore();
      const response = await axios.get('http://localhost:3000/users/essential', {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Napaka pri pridobivanju podatkov iz /company/essential:', error);
      throw error;
    }
  };

  // **Funkcija za pridobivanje podatkov iz /contract/essential**
export const fetchContractsCreate = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/contract/essential', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /groups/essential:', error);
    throw error;
  }
};

// **Funkcija za pridobivanje podatkov iz /groups/essential**
export const fetchGroupsCreate = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/groups/essential', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /groups/essential:', error);
    throw error;
  }
};

///////////////////////////////////

// **Funkcija za ustvarjanje zahtevka po meri**
export const createCustomTicket = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.post(`http://localhost:3000/tickets/`, data, {
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

// **Funkcija za dodeljevanja zahtevka reševalcu zahtevka po meri**
export const assignTicket = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.post(`http://localhost:3000/time-worked/`, data, {
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

// **Funkcija za pridobivanje vseh ticketov**
export const loadTickets = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/tickets', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets:', error);
    throw error;
  }
};

// **Funkcija za pridobivanje vseh razrešenih ticketov**
export const loadResolvedTickets = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/tickets/resolved', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets/resolved:', error);
    throw error;
  }
};

// **Funkcija za pridobivanje mojih dodeljenih ticketov**
export const loadMaAssignedTickets = async (user_id: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/tickets/my/${user_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /tickets/my/${user_id}:`, error);
    throw error;
  }
};

// **Funkcija za pridobivanje osnovnih podatkov o ticketih**
export const fetchTicketDataCreate = async () => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get('http://localhost:3000/tickets/essential', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets:', error);
    throw error;
  }
};

// **Funkcija za pridobivanje ticketov**
export const fetchTicketDetails = async (ticket_id: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/tickets/${ticket_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets:', error);
    throw error;
  }
};

// **Funkcija za ustvarjanje zahtevka po meri**
export const updateTicket = async (ticket_id: string, data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/tickets/${ticket_id}`, data, {
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

// **Funkcija za dodajanje novega chat sporočila**
export const addComment = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.post(`http://localhost:3000/chat/privat`, data, {
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

// **Funkcija za pridobivanje vsek komentarjev ticketa**
export const fetchComments = async (ticket_id: number) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/chat/privat/${ticket_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets:', error);
    throw error;
  }
};

// **Funkcija za posodabljanje primarnega reševalca**
export const assignTicketUpdate = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/time-worked/update`, data, {
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

// **Funkcija za posodabljanje pomožnih reševalcev**
export const assignTicketUpdateAdditional = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/time-worked-update/additional`, data, {
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

// **Funkcija za pridobivanje vseh reševalcev ticketa**
export const getAllAssignees = async (ticket_id: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/tickets-time-worked/${ticket_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets-time-worked:', error);
    throw error;
  }
};

// **Funkcija za pridobivanje vseh reševalcev ticketa tudi tistih, ki imajo samo ure vpisane**
export const getAssignees = async (ticket_id: number) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/tickets-time-worked-all/${ticket_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets-time-worked-all:', error);
    throw error;
  }
};

// **Funkcija za nalaganje dokumenta**
export const uploadChatFile = async (ticketId: number, file: File, isPrivate: boolean) => {
  const authStore = useAuthStore();
  const formData = new FormData();
  formData.append("ticket_id", String(ticketId));
  formData.append("isPrivate", String(isPrivate));
  formData.append("file", file);
  formData.append("filename", file.name);

  return await axios.post(`${API_URL}/chat/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${authStore.accessToken}`,
    },
  });
};

// **Funkcija za nalaganje ur uporabnika za posamezen ticket**
export const fetchWorkLog = async (ticketId: string, userId: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/time-worked/${userId}/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /tickets:', error);
    throw error;
  }
};

// **Funkcija za shranjevanje ur za posamezen ticket**
export const createWorkLog = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.post(`http://localhost:3000/time-worked`, data, {
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

// **Funkcija za posodobitev podatkov uporabnika**
export const saveWorkLog = async (ticketId: string, userId: string, updatedData: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/time-worked/${userId}/${ticketId}`, updatedData, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri posodabljanju podjetja vnosa časa (user ID: ${userId}, ticket ID: ${ticketId}):`, error);
    throw error;
  }
};

// **Funkcija za posodobitev statusa ticketa**
export const updateTicketStatus = async (ticketId: number, status: string, close_code?: string, close_notes?: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.put(`http://localhost:3000/tickets/close/${ticketId}`, { status, close_code, close_notes }, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri posodabljanju statusa ticketa:`, error);
    throw error;
  }
};

///////////////////////

// **Funkcija za pridobivanje podatka enega podjetja iz /company**
export const fetchCompanyDataById = async (companyId: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/company/${companyId}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /company/${companyId}:`, error);
    throw error;
  }
};

// **Funkcija za pridobivanje podatka enega podjetja iz /users**
export const fetchUserDataById = async (callerId: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/users/${callerId}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /users/${callerId}:`, error);
    throw error;
  }
};

// **Funkcija za pridobivanje podatka enega podjetja iz /contract**
export const fetchContractDataById = async (contractId: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/contract/${contractId}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /contract/${contractId}:`, error);
    throw error;
  }
};

// **Funkcija za pridobivanje podatka enega podjetja iz /groups**
export const fetchGroupDataById = async (groupId: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/groups/${groupId}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /groups/${groupId}:`, error);
    throw error;
  }
};

// **Posodobi accept_sla_breach za zahtevek**
export const submitAcceptSlaBreach = async (ticketId: number, reason: string, accept_sla: boolean) => {
  try {
    const authStore = useAuthStore()
    const response = await axios.put(`http://localhost:3000/ticket/${ticketId}/sla-accept-breach`, 
      { reason, accept_sla },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      }
    )
    return response.data;
  } catch (error) {
    console.error(`Napaka pri posodobitvi SLA breach za ticket ${ticketId}:`, error)
    throw error
  }
}

// **Funkcija za pridobivanje imena, priimka ter podjetja kjer dela uporabnik user_id**
export const fetchUserEssentialDataById = async (user_id: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/userData/${user_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Napaka pri pridobivanju podatkov iz /userData:', error);
    throw error;
  }
};

// **Funkcija za ustvarjanje zahtevka**
export const createTicket = async (data: Record<string, any>) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.post(`http://localhost:3000/tickets/create`, data, {
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

// **Funkcija za pridobivanje, ki je klicatelj uporabnik**
export const loadMyTickets = async (user_id: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/tickets/essential/${user_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /tickets/${user_id}:`, error);
    throw error;
  }
};

// **Funkcija za pridobivanje, ki je klicatelj uporabnik**
export const loadMyTicketById = async (user_id: string, ticket_id: string) => {
  try {
    const authStore = useAuthStore();
    const response = await axios.get(`http://localhost:3000/tickets/essential/${ticket_id}/${user_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov iz /tickets/essential/${ticket_id}/${user_id}:`, error);
    throw error;
  }
};

// **Pridobi vse vzdrževalne dogodke za določen teden**
export const getMaintenancesForWeek = async (weekStart: string) => {
  const authStore = useAuthStore();
  const response = await axios.get(`http://localhost:3000/maintenance/week?start=${weekStart}`, {
    headers: {
      Authorization: `Bearer ${authStore.accessToken}`,
    },
  })
  return response.data
}

// **Dodaj nov vzdrževalni dogodek**
export const addMaintenance = async (maintenance: any) => {
  const authStore = useAuthStore()
  const response = await axios.post('http://localhost:3000/maintenance', maintenance, {
    headers: {
      Authorization: `Bearer ${authStore.accessToken}`,
    },
  })
  return response.data
}

// **Posodobi vzdrževanje za maintenance_id**
export const updateMaintenance = async (maintenanceId: number, data: Record<string, any>) => {
  try {
    const authStore = useAuthStore()
    const response = await axios.put(`http://localhost:3000/maintenance/${maintenanceId}`, data,
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      }
    )
    return response.data;
  } catch (error) {
    console.error(`Napaka pri posodobitvi SLA breach za ticket ${maintenanceId}:`, error)
    throw error
  }
}

// **Pridobivanje podrobnih podatkov o trenutnem uporabniku**
export const fetchCurrentUserInfo = async (user_id: number) => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get(`http://localhost:3000/user/info/${user_id}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov za uporabnika ${user_id}:`, error)
    throw error
  }
}

// **Menjava gesla na podlagi obstoječega gesla**
export const changePassword = async (user_id: number, old_password: string, new_password: string) => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.put(`http://localhost:3000/users/password/user/reset/${user_id}`, {
      old_password,
      new_password,
    }, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri posodabljanju gesla za uporabnika ${user_id}:`, error)
    throw error
  }
}

// statistike

// **Statistika za status ticketov**
export const getTicketStatusStats = async () => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get('http://localhost:3000/statistics/status', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// **Statistika za prioriteto ticketov**
export const getTicketPriorityStats = async () => {
  try
  {
  const authStore = useAuthStore()
  const response = await axios.get('http://localhost:3000/statistics/priority', {
    headers: { Authorization: `Bearer ${authStore.accessToken}` }
  })
  return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// **Statistika za tip ticketov**
export const getTicketTypeStats = async () => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get('http://localhost:3000/statistics/type', {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// **Statistika za prikaz najbolj pogostih reševalcev ticketov**
export const getResolverTypeStats = async () => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get('http://localhost:3000/statistics/resolver', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// **Statistika za prikaz najbolj zahtevnih podjetij**
export const getCompaniesTypeStats = async () => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get('http://localhost:3000/statistics/companies', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// **Statistika za prikaz mesečnih ticketov**
export const getMonthlyTicketStats = async () => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get('http://localhost:3000/statistics/monthly', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

export const getGlobalStatistics = async () => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get('http://localhost:3000/statistics/summary', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// Funkcija za pridobivanje ticketov v določenem obdobju
export const getCompanyTicketsWithinPeriod = async (companyId: number, from: string, to: string) => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get(`http://localhost:3000/statistics/company-tickets/${companyId}?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }
}

// Funkcija za vnosov časa za določen ticket za obdobje
export const getTimeWorkedForCompanyTickets = async (companyId: number, from: string, to: string) => {
  try
  {
    const authStore = useAuthStore()
    const response = await axios.get(`http://localhost:3000/statistics/company-timeworked/${companyId}?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    })
    return response.data
  } catch (error) {
    console.error(`Napaka pri pridobivanju statistik`, error)
    throw error
  }  
}