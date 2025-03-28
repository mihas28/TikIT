<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchTicketDetails, updateTicket, addComment, fetchComments, updateTicketStatus, uploadChatFile, fetchUsersCreate, fetchCompanyDataCreate, fetchContractsCreate, fetchGroupsCreate, assignTicketUpdate, fetchTicketDataCreate, assignTicket, assignTicketUpdateAdditional, getAllAssignees, submitAcceptSlaBreach } from '@/api/api';
import { io } from 'socket.io-client';
import WorkLogModal from '../components/ticket_components/WorkLogModal.vue';
import DetailsModal from '../components/ticket_components/DetailsModal.vue';
import SlaBreachModal from '../components/ticket_components/SlaBreachModal.vue'

import { useAuthStore } from '../stores/authStore';
import { jwtDecode } from "jwt-decode";
import { formatRFC3339 } from 'date-fns';

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

const router = useRouter();

const route = useRoute();
const ticketId = ref(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id);

// **Formatiranje datuma**
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

let getData: boolean = true;
let oldUserId: number = 0;

const currentUserId = ref<string>('');

const comments = ref<any[]>([]);
const ticket_comments = ref<any>({});
const newPublicComment = ref('');
const newPrivateComment = ref('');
const uploadedFile = ref<File | null>(null);
const authStore = useAuthStore();

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  query: { user_id: 123 },
  transports: ["websocket"],
  auth: {
    token: authStore.accessToken,
  },
  reconnection: true, // Omogoči ponovno povezovanje
  reconnectionAttempts: 10000, // Največ 10000 poskusov
  reconnectionDelay: 200, // 2 sekundi med poskusi
  timeout: 250000, // Časovna omejitev za povezavo
}); 

const getUserIdFromJWT = () => {
  const authStore = useAuthStore();
  const token = authStore.accessToken; // Pridobi JWT iz Pinia

  if (!token) {
    console.error("JWT ni na voljo");
    return null;
  }

  try {
    const decoded: { userId?: string } = jwtDecode(token); // Dekodiraj JWT
    return decoded.userId || null; // Vrni `userId`
  } catch (error) {
    console.error("Napaka pri dekodiranju JWT:", error);
    return null;
  }
};

const selectedType = ref<string>("");
const selectedId = ref<number>(0);
const isDetailsModalOpen = ref(false);

const isLoading = ref(false);
const isWorkLogModalOpen = ref(false);

const companies = ref<{id: number, name: string}[]>([]);
const users = ref<{id: number, name: string, email: string, companyid: number, groupid: number}[]>([]);
const contracts = ref<{id: number, name: string, status: string, description: string, companyid: number}[]>([]);
const groups = ref<{id: number, name: string}[]>([]);
const tickets = ref<{id: number, name: string}[]>([]);

// **Izbrane vrednosti**
const selectedCompany = ref<{ id: number; name: string } | null>(null);
const selectedCaller = ref<{ id: number; name: string } | null>(null);
const selectedContract = ref<{ id: number; name: string } | null>(null);
const selectedEngineer = ref<{ id: number; name: string } | null>(null);
const selectedGroup = ref<{ id: number; name: string } | null>(null);
const additionalResolvers = ref<{ id: number; name: string }[]>([]);
const errorMessage = ref('');

// **Ali so vnosna polja in gumbi omogočeni
const isTicketEditable = ref(true);
const isTicketEditableClosed = ref(true);

// **Polja za iskanje**
const companySearch = ref('');
const callerSearch = ref('');
const contractSearch = ref('');
const engineerSearch = ref('');
const resolverSearch = ref('');
const parentTicketSearch = ref('');
const groupSearch = ref('');

const ticket = ref({ticket:
  {
    accept_sla_breach: '',
    accepted_at: '',
    assignment_group: '',
    caller: '',
    caller_id: 0,
    close_code: '',
    close_notes: '',
    company_id: 0,
    company_name: '',
    contract_id: 0,
    contract_name: '',
    created_at: '',
    description: '',
    group_id: 0,
    impact: 0,
    parent_ticket_id: 0,
    parent_ticket_title: '',
    priority: '',
    resolved_at: '',
    sla_breach: '',
    state: '',
    ticket_id: 0,
    title: '',
    type: '',
    updated_at: '',
    urgency: 0,
  },
  primary: [{
    created_at: '',
    description: '',
    primary_resolver: '',
    resolver: '',
    ticket_id: 0,
    time_worked: '',
    updated_at: '',
    user_id: 0,
  }],
  other: [{
    created_at: '',
    description: '',
    primary_resolver: '',
    resolver: '',
    ticket_id: 0,
    time_worked: '',
    updated_at: '',
    user_id: 0,
  }]
});

const resolvers = ref({
  primary: {
    created_at: '',
    description: '',
    primary_resolver: '',
    resolver: '',
    ticket_id: 0,
    time_worked: '',
    updated_at: '',
    user_id: 0,
  },
  other: [{ 
    created_at: '',
    description: '',
    primary_resolver: '',
    resolver: '',
    ticket_id: 0,
    time_worked: '',
    updated_at: '',
    user_id: 0,
  }]
});

const impactOptions = [
  { value: '3', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'High' }
];

const urgencyOptions = [
  { value: '3', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'High' }
];

const typeOptions = [
  { value: 'incident', label: 'Incident' },
  { value: 'service request', label: 'Request' }
];

const slaAccepted = ref(true);
const acceptSlaRemaining = ref<number | null>(null);
const showSlaBreachModal = ref(false);

// **Funkcija za izračun preostalega časa**
const calculateAcceptSla = () => {
  if (ticket.value.ticket.type !== 'incident' || ticket.value.ticket.state !== 'new') return

  const priority = ticket.value.ticket.priority; // pričakujemo 'P1', 'P2', ...
  const created = dayjs(ticket.value.ticket.created_at);
  const now = dayjs();

  const hoursMap: Record<string, number> = {
    P1: 1, P2: 2, P3: 3, P4: 4
  }

  const deadline = created.add(hoursMap[priority.slice(0,2)] || 4, 'hour')
  const diffMs = deadline.diff(now)

  acceptSlaRemaining.value = diffMs > 0 ? diffMs : 0;

  if (diffMs <= 0 && !slaAccepted.value) {
    showSlaBreachModal.value = true
  }
}

const getPriority = () => {
    let impact: number = ticket.value.ticket.impact;
    let urgency: number = ticket.value.ticket.urgency;
    let priority: number;

    if (impact == 1 && urgency == 1) {
        priority = 1;
    } else if ((impact == 2 && urgency == 1) || (impact == 1 && urgency == 2)) {
        priority = 2;
    } else if ((impact == 3 && urgency == 1) || (impact == 1 && urgency == 3) || (impact == 2 && urgency == 2)) {
        priority = 3;
    } else if ((impact == 3 && urgency == 2) || (impact == 2 && urgency == 3) || (impact == 3 && urgency == 3)) {
        priority = 4;
    } else {
        priority = 4; // Privzeto P4, če ni ujemanja
    }

    // Vrni tekstualno vrednost priority
    if (priority === 1) {
        ticket.value.ticket.priority = "P1 - Kritična";
    } else if (priority === 2) {
      ticket.value.ticket.priority = "P2 - Visoka";
    } else {
      ticket.value.ticket.priority = `P${priority} - Nizka`;
    }
};

const showResolutionForm = ref(false);
const resolution = ref({
  close_code: '',
  close_notes: '',
  addToComments: true
});

const showAwaitingInfoForm = ref(false);
const awaitingInfoReason = ref('');

// **Funkcija za prikaz polja in skrolanje do njega**
const toggleResolutionForm = () => {
  showResolutionForm.value = !showResolutionForm.value;
  if (showResolutionForm.value) {
    nextTick(() => {
      document.getElementById('resolution-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
};

// **Funkcija za prikaz polja Awaiting info in skrolanje do njega**
const toggleAwaitingInfoForm = () => {
  showAwaitingInfoForm.value = !showAwaitingInfoForm.value;
  if (showAwaitingInfoForm.value) {
    nextTick(() => {
      document.getElementById('resolution-section1')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
};

const assignToMe = async () => {
  await getDataFunction();
  engineerSearch.value = users.value.find(u => u.id === parseInt(currentUserId.value, 10))?.name || '';
  selectEngineer(users.value.find(u => u.id === parseInt(currentUserId.value, 10)));
  additionalResolvers.value = additionalResolvers.value.filter(r => r.id !== parseInt(currentUserId.value, 10));
  await saveChanges();
  ticket.value.primary[0].user_id = parseInt(currentUserId.value, 10);
};

// **Funkcija za spremenitev stanja - AwaitingInfo**
const saveChangesAwaiting = async () => {
  try {
    if (awaitingInfoReason.value === '')
    {
      alert("Vnesi razlog za čakanje")
      //showResolutionForm.value = !showResolutionForm.value;
      return;
    }
    await updateTicketStatus(Number(ticketId.value), 'awaiting info');
    ticket.value.ticket.state = 'awaiting info';

    const text = "Zahtevek "+ ticketId.value +" je v stanju čakanja na odziv, s sporočilom:\n" + awaitingInfoReason.value;

    if (resolution.value.addToComments) {
      const commentData = {
        ticket_id: ticketId.value,
        message: { type: "text", content: text },
        isPrivate: false
      };
      socket.emit("sendMessage", commentData);
    }
  } catch (error) {
    console.error("Napaka pri zapiranju zahtevka:", error);
  }
};

// **Funkcija za zaprtje zahtevka**
const resolveTicket = async () => {
  try {
    if (resolution.value.close_code === '' || resolution.value.close_notes === '')
    {
      alert("Vnesi kodo razrešitve in opombe!")
      //showResolutionForm.value = !showResolutionForm.value;
      return;
    }
    await updateTicketStatus(Number(ticketId.value), 'resolved', resolution.value.close_code, resolution.value.close_notes);
    ticket.value.ticket.state = 'resolved';
    ticket.value.ticket.resolved_at = new Date().toISOString();

    const text = "Zahtevek "+ ticketId.value +" je bil razrešen z kodo:\n"+ resolution.value.close_code + "\nin z opisom:\n" + resolution.value.close_notes;

    if (resolution.value.addToComments) {
      const commentData = {
        ticket_id: ticketId.value,
        message: { type: "text", content: text },
        isPrivate: false
      };
      socket.emit("sendMessage", commentData);
    }
  } catch (error) {
    console.error("Napaka pri zapiranju zahtevka:", error);
  }
};

// **Funkcija za ponovno odprtje zahtevka**
const reopenTicket = async () => {
  try {
    await updateTicketStatus(Number(ticketId.value), 'open');
    ticket.value.ticket.state = 'open';
    ticket.value.ticket.resolved_at = "";

    const text = "Zahtevek "+ ticketId.value +" je ponovno odprt";

    if (!isTicketEditableClosed.value)
    {
      isTicketEditable.value = true;
      isTicketEditableClosed.value = true;
    }

    // Dodaj zapis v komunikacijo
    const commentData = {
      ticket_id: ticketId.value,
      message: { type: "text", content: text },
      isPrivate: false
    };

    showResolutionForm.value = false;

    socket.emit("sendMessage", commentData);
  } catch (error) {
    console.error("Napaka pri odpiranju zahtevka:", error);
  }
};

// **Funkcija za preklic zahtevka**
const cancelTicket = async () => {
  try {
    if (confirm("Ali ste prepričani, da želite preklicati zahtevek ID: "+ ticketId.value +"?"))
    {
      await updateTicketStatus(Number(ticketId.value), 'cancelled');
      ticket.value.ticket.state = 'cancelled';
      // Onemogoči vsa vnosna polja in gumbe
      isTicketEditable.value = false;

      const text = "Zahtevek "+ ticketId.value +" je bil preklican!";
      // Dodaj zapis v komunikacijo
      const commentData = {
        ticket_id: ticketId.value,
        message: { type: "text", content: text },
        isPrivate: false
      };
      socket.emit("sendMessage", commentData);
    }
  } catch (error) {
    console.error("Napaka pri preklicu zahtevka:", error);
  }
};

const formattedDate = ref('');

// **Vidnost dropdowna**
const showDropdowns = ref<{ [key in 'company' | 'caller' | 'contract' | 'engineer' | 'resolver' | 'additional' | 'group' | 'ticket']: boolean }>({
  company: false,
  caller: false,
  contract: false,
  engineer: false,
  resolver: false,
  additional: false,
  ticket: false,
  group: false
});

// **Pridobivanje podatkov o ticketu**
const loadTicket = async () => {
  try {
    isLoading.value = true;
    ticket.value = await fetchTicketDetails(ticketId.value);

    if (ticket.value.ticket.state === 'cancelled')
      isTicketEditable.value = false;
    else if (ticket.value.ticket.state === 'closed')
    {
      isTicketEditable.value = false;
      isTicketEditableClosed.value = false;
    }
      
    if (ticket.value.primary[0] !== undefined)
    {
      oldUserId = ticket.value.primary[0].user_id;
    }
      
    slaAccepted.value = ticket.value.ticket.accept_sla_breach !== null;//(ticket.value.ticket.accept_sla_breach !== 'k');// && (ticket.value.ticket.accept_sla_breach !== null);

    companySearch.value = ticket.value.ticket.company_name;
    callerSearch.value = ticket.value.ticket.caller;
    selectedCaller.value = { id: ticket.value.ticket.caller_id, name: ticket.value.ticket.caller };
    contractSearch.value = ticket.value.ticket.contract_name;
    selectedContract.value = { id: ticket.value.ticket.contract_id, name: ticket.value.ticket.contract_name };

    //dodano 20.3
    selectedCompany.value = { id: ticket.value.ticket.company_id, name: ticket.value.ticket.company_name };
    selectedCaller.value = { id: ticket.value.ticket.caller_id, name: ticket.value.ticket.caller };
    selectedGroup.value = { id: ticket.value.ticket.group_id, name: ticket.value.ticket.assignment_group };
    if (ticket.value.primary[0] !== undefined)
      selectedEngineer.value = { id: ticket.value.primary[0].user_id, name: ticket.value.primary[0].resolver };
    /*additionalResolvers.value = ticket.value.other.map((resolver: { user_id: number; resolver: string }) => ({
      id: resolver.user_id,
      name: resolver.resolver,
    }));*/

    try
    {
      parentTicketSearch.value = "["+ ticket.value.ticket.parent_ticket_id.toString() + "] " + ticket.value.ticket.parent_ticket_title;
    } catch (error) {
      parentTicketSearch.value = '';
    };

    
    if (ticket.value.ticket.state !== "new")
    {
      try
      {
        engineerSearch.value = ticket.value.primary[0].resolver;
      } catch (error) {
        engineerSearch.value = '';
      }
    }
    else
     await getDataFunction();

    ticket.value.other.forEach(data => {
      addResolver({ id: data.user_id, name: data.resolver });
    }); 

    groupSearch.value = ticket.value.ticket.assignment_group;
    selectedGroup.value = { id: ticket.value.ticket.group_id, name: ticket.value.ticket.assignment_group };
    formattedDate.value = formatDate(ticket.value.ticket.created_at);
    getPriority();

  } catch (error) {
    console.error("Napaka pri nalaganju ticket podrobnosti:", error);
  } finally {
    isLoading.value = false;
  }
};

// **Shranjevanje sprememb ticketov**
const saveChanges = async () => {
  try {
    // Posodobi osnovne podatke o ticketu
    ticket.value.ticket.caller_id = selectedCaller.value?.id ?? 0;
    ticket.value.ticket.group_id = selectedGroup.value?.id ?? 0;
    ticket.value.ticket.contract_id = selectedContract.value?.id ?? 0;

    // Preveri, ali imamo izbranega inženirja
    if (!selectedEngineer.value) {
      selectedEngineer.value = {
        id: ticket.value.primary?.[0]?.user_id ?? -1,
        name: ticket.value.primary?.[0]?.resolver ?? "",
      };
    }

    // Če je ticket v stanju "new", ga premaknemo v "open" in dodelimo uporabnike
    if (ticket.value.ticket.state === "new") {
      if (selectedEngineer.value.id !== -1)
      {
        await assignTicket({
          user_id: selectedEngineer.value.id,
          ticket_id: ticket.value.ticket.ticket_id,
          primary: true,
        });

      for (const user of additionalResolvers.value) {
          await assignTicket({
            user_id: user.id,
            ticket_id: ticket.value.ticket.ticket_id,
            primary: false,
          });
        }
      }
      
      ticket.value.ticket.accepted_at = new Date().toISOString();

      const text = "Zahtevek "+ ticketId.value +" je bil sprejet v izvedbo";
      // Dodaj zapis v komunikacijo
      const commentData = {
        ticket_id: ticketId.value,
        message: { type: "text", content: text },
        isPrivate: false
      };
      socket.emit("sendMessage", commentData);

    } else {
      // Počakaj na Vue posodobitev
      await nextTick();

      // Preveri, ali `primary` array obstaja in ni prazen
      if (!ticket.value.primary || ticket.value.primary.length === 0) {
        console.error("ticket.value.primary še ni naložen!");
        return;
      }

      // Preveri, ali `user_id` obstaja in če je potreben update
      if (ticket.value.ticket.state !== "new" && oldUserId !== selectedEngineer.value.id) {
        
        await assignTicketUpdate({
          new_user_id: selectedEngineer.value.id,
          old_user_id: oldUserId,
          ticket_id: ticket.value.ticket.ticket_id,
          primary: true,
        });

        // Počakaj na osvežitev podatkov po spremembi
        resolvers.value = await getAllAssignees(ticketId.value);
        ticket.value.primary[0] = resolvers.value.primary;
        oldUserId = selectedEngineer.value.id;
        ticket.value.other = resolvers.value.other;
      }

      // Preveri dodatne resolverje
      await nextTick();

      const oldResolvers = ticket.value.other.map((resolver: { user_id: number }) => resolver.user_id);
      const newResolvers = additionalResolvers.value.map((resolver: { id: number }) => resolver.id);

      const oldSet = new Set(oldResolvers);
      const newSet = new Set(newResolvers);

      const toRemove = oldResolvers.filter(id => !newSet.has(id));
      const toAdd = newResolvers.filter(id => !oldSet.has(id));

      if (toRemove.length > 0 || toAdd.length > 0) {
        await assignTicketUpdateAdditional({
          toRemove,
          toAdd,
          ticket_id: ticket.value.ticket.ticket_id,
        });

        // Počakaj na nove podatke, preden jih nastaviš
        resolvers.value = await getAllAssignees(ticketId.value);
        ticket.value.primary[0] = resolvers.value.primary;
        ticket.value.other = resolvers.value.other;
      }
    }

    // Nastavi na stanje open, če je na stanju new
    if (ticket.value.ticket.state === "new")
      ticket.value.ticket.state = "open";

    // Shrani spremembe v bazo
    await updateTicket(String(ticketId.value), ticket.value.ticket);

    //POMEMBNO - DODANI DEL ZA POSODOBITEV REŠEVALCA 
    if (ticket.value.primary[0] === undefined)
    ticket.value.primary.push({
      created_at: '',
      description: '',
      primary_resolver: selectedEngineer.value.name,
      resolver: '',
      ticket_id: 0,
      time_worked: '',
      updated_at: '',
      user_id: selectedEngineer.value.id,
    })
    else
    {
      ticket.value.primary[0].user_id = selectedEngineer.value.id;
    }
    
    alert("Spremembe shranjene!");
  } catch (error) {
    console.error("Napaka pri shranjevanju:", error);
  }
};

// **Filtriranje glede na vnos**
const filteredCompanies = computed(() =>
  companies.value.filter(c => c.name.toLowerCase().includes(companySearch.value.toLowerCase()))
);

const filteredUsers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(callerSearch.value.toLowerCase()) &&
    (!selectedCompany.value || u.companyid === selectedCompany.value.id) &&
    (!selectedEngineer.value || u.id !== selectedEngineer.value.id) && // Ne sme biti isti kot reševalec
    (!additionalResolvers.value.some(r => r.id === u.id)) // Ne sme biti že dodan kot dodatni reševalec
  )
);

const filteredContracts = computed(() =>
  contracts.value.filter(c =>
    c.name.toLowerCase().includes(contractSearch.value.toLowerCase()) &&
    (!selectedCompany.value || c.companyid === selectedCompany.value.id)
  )
);

const filteredGroups = computed(() =>
    groups.value.filter(c => c.name.toLowerCase().includes(groupSearch.value.toLowerCase()) &&
    (!selectedEngineer.value || c.id === selectedEngineer.value.id)
 )
);

const filteredEngineers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(engineerSearch.value.toLowerCase()) &&
    (!selectedGroup.value || u.groupid === selectedGroup.value.id) &&
    (!selectedCaller.value || u.id !== selectedCaller.value.id) && // Ne sme biti isti kot klicatelj
    (!additionalResolvers.value.some(r => r.id === u.id)) // Ne sme biti že dodan kot dodatni reševalec
  )
);

const filteredTickets = computed(() =>
  tickets.value.filter(t =>
    (t.name.toLowerCase().includes(parentTicketSearch.value.toLowerCase()) || t.id.toString().includes(parentTicketSearch.value.toLowerCase())) && 
    (t.id.toString() !== ticketId.value)
));

const filteredResolvers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(resolverSearch.value.toLowerCase()) &&
    !additionalResolvers.value.some(r => r.id === u.id) && // Ne sme biti že dodan kot dodatni reševalec
    (!selectedEngineer.value || u.id !== selectedEngineer.value.id) && // Ne sme biti isti kot glavni reševalec
    (!selectedCaller.value || u.id !== selectedCaller.value.id) // Ne sme biti isti kot klicatelj
  )
);

// **Funkcija za čiščenje polj pri napačni izbiri**
const resetAllFields = () => {
  selectedCaller.value = null;
  selectedContract.value = null;
  selectedEngineer.value = null;
  selectedGroup.value = null;
  selectedCompany.value = null;
  additionalResolvers.value = [];
  callerSearch.value = '';
  contractSearch.value = '';
  engineerSearch.value = '';
  resolverSearch.value = '';
  errorMessage.value = '';
};

// **Nastavi podjetje ob izbiri**
const selectCompany = (company: any) => {
  if (selectedCaller.value || selectedContract.value || selectedEngineer.value) {
    resetAllFields();
  }
  selectedCompany.value = company;
  companySearch.value = company.name;
  showDropdowns.value.company = false;
};

// **Nastavi klicatelja in avtomatsko podjetje**
const selectCaller = (user: any) => {
  if (selectedEngineer.value && user.id === selectedEngineer.value.id) {
    resetAllFields();
    return;
  }
  selectedCaller.value = user;
  callerSearch.value = user.name;
  selectedCompany.value = companies.value.find(c => c.id === user.companyid) || null;
  companySearch.value = selectedCompany.value ? selectedCompany.value.name : '';
  showDropdowns.value.caller = false;
};

// **Nastavi skupino**
const selectGroup = (group: any) => {
    if (group.id !== selectedEngineer.value?.id) {
        resetAllFields();
    }
  selectedGroup.value = group;
  groupSearch.value = group.name;
  //selectedEngineer.value = users.value.find(u => u.id === group.id) || null;
  //engineerSearch.value = selectedEngineer.value ? selectedEngineer.value.name : '';
  showDropdowns.value.group = false;
};

// **Nastavi nadrejeni zahtevek**
const selectTicket = (tic: any) => {
  ticket.value.ticket.parent_ticket_id = tic.id;
  parentTicketSearch.value = "[" + tic.id + "] " + tic.name;
  showDropdowns.value.ticket = false;
};

// **Nastavi pogodbo**
const selectContract = (contract: any) => {
  selectedContract.value = contract;
  contractSearch.value = contract.name;
  showDropdowns.value.contract = false;
};

// **Nastavi reševalca**
const selectEngineer = (user: any) => {
  if (selectedCaller.value && user.id === selectedCaller.value.id) {
    resetAllFields();
    return;
  }
  selectedEngineer.value = user;
  engineerSearch.value = user.name;
  selectedGroup.value = groups.value.find(g => g.id === (users.value.find(h => h.id === user.id))?.groupid) || null;
  groupSearch.value = selectedGroup.value ? selectedGroup.value.name : '';
  showDropdowns.value.engineer = false;
};

// **Dodaj dodatnega reševalca**
const addResolver = (user: any) => {
  additionalResolvers.value.push(user);
  resolverSearch.value = '';
  showDropdowns.value.additional = false;
};

// **Zunanja klik funkcija za zapiranje dropdownov**
const closeDropdowns = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest("input")) {
    Object.keys(showDropdowns.value).forEach(key => (showDropdowns.value[key as keyof typeof showDropdowns.value] = false));
  }
};

// **Odstrani dodatnega reševalca**
const removeResolver = (user: any) => {
  if (getData)
  {
    loadUsers();
    loadCompanies();
    loadContracts();
    loadGroups();
    loadTickets();
    document.addEventListener("click", closeDropdowns);
    //document.removeEventListener("click", closeDropdowns)
    getData = !getData;
  }
  additionalResolvers.value = additionalResolvers.value.filter(r => r.id !== user.id);
};

// **Funkcija za nalaganje uporabnikov**
const loadUsers = async () => {
  try {
    users.value = await fetchUsersCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju uporabnikov:', error);
  }
};

// **Funkcija za nalaganje podjetij**
const loadCompanies = async () => {
  try {
    companies.value = await fetchCompanyDataCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju podjetij:', error);
  }
};

// **Funkcija za nalaganje pogodb**
const loadContracts = async () => {
  try {
    contracts.value = await fetchContractsCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju pogodb:', error);
  }
};

// **Funkcija za nalaganje skupin**
const loadGroups = async () => {
  try {
    groups.value = await fetchGroupsCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju skupin:', error);
  }
};

// **Funkcija za nalaganje zahtevkov**
const loadTickets = async () => {
  try {
    tickets.value = await fetchTicketDataCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju skupin:', error);
  }
};

const sendComment = async (isPublic: boolean) => {
  const text = isPublic ? newPublicComment.value : newPrivateComment.value;
  if (!text.trim() && !uploadedFile.value) return;

  let messageData: any = {
    ticket_id: ticketId.value,
    isPrivate: !isPublic,
  };

  if (uploadedFile.value) {
    const file = uploadedFile.value;

    if (file.type === "application/pdf") {
      try {
        const response = await uploadChatFile(Number(ticketId.value), file, !isPublic);
        const newMessage = response.data;
        uploadedFile.value = null; // **Pošiljanje uspešno - resetiraj datoteko**

        // ** Pošlji obvestilo preko WebSocket-a**
        socket.emit("newFileUploaded", newMessage);
      } catch (error) {
        console.error("Napaka pri nalaganju PDF:", error);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        messageData.message = {
          type: file.type.startsWith("image") ? "image" : "document",
          content: reader.result,
        };

        socket.emit("sendMessage", messageData, (ack: any) => {
          if (ack?.success) uploadedFile.value = null;
        });
      };
      reader.readAsDataURL(file);
    }
  } else {
    messageData.message = {
      type: "text",
      content: text,
    };

    socket.emit("sendMessage", messageData, (ack: any) => {
      if (ack?.success) {
        if (isPublic) newPublicComment.value = "";
        else newPrivateComment.value = "";
      }
    });
  }
};

const openDocument = (base64String: string, filename: string = "dokument.pdf") => {
  if (!base64String.startsWith("data:")) {
    base64String = `data:application/pdf;base64,${base64String}`;
  }

  const byteCharacters = atob(base64String.split(",")[1]); // Pretvori Base64 v binarne podatke
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  // **Odpri PDF v novem zavihku**
  const newTab = window.open(blobUrl, "_blank");
  if (!newTab) {
    alert("Dovoli pojavna okna za ogled datotek!");
    return;
  }

  // **Počisti URL, ko ni več potreben**
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
};

// **Povleci in spusti datoteko**
const handleFileDrop = (event: DragEvent) => {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];

  if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
    uploadedFile.value = file;
  } else {
    alert("Dovoljene so samo slike (.jpg, .png) in PDF datoteke!");
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    uploadedFile.value = input.files[0];
  }
};

// **Pošlji razlog v backend in shrani v chat**
const submitSlaBreachReason = async (reason: string) => {
  if (!reason.trim()) return
  try {
    // Pošlji razlog za accept SLA breach
    await submitAcceptSlaBreach(parseInt(ticketId.value,10), reason, true);

    let messageData: any = {
      ticket_id: ticketId.value,
      isPrivate: false,
    };

    messageData.message = {
      type: "text",
      content: `Razlog za prekoračen SLA za sprejetje: ${reason}`,
    };

    socket.emit("sendMessage", messageData);

    // Posodobi lokalno stanje
    ticket.value.ticket.accept_sla_breach = reason;
    slaAccepted.value = true;
    showSlaBreachModal.value = false;
  } catch (err) {
    console.error('Napaka pri shranjevanju SLA breach razloga:', err)
  }
}


onMounted(async () => {
  const regex1 = /^Zahtevek (\d+) je bil razrešen z kodo:\n(duplicate|cancelled|other|solved)\nin z opisom:\n(.+)$/;
  const regex2 = /Zahtevek (\d+) je v stanju čakanja na odziv, s sporočilom:\n([\s\S]+)/;

  currentUserId.value = getUserIdFromJWT() || '';

  await loadTicket();
  calculateAcceptSla()
  setInterval(() => {
    calculateAcceptSla()
  }, 1000)

  socket.emit("joinTicket", ticketId.value); // Pridruži se sobi WebSocket-a

  // Pridobi pretekle komentarje preko WebSocket-a
  socket.on("chatHistory", (messages) => {
    comments.value = messages;
  });

  // ** Poslušaj nova sporočila v realnem času**
  socket.on("newMessage", (message) => {
    if ((ticket.value.ticket.state === "resolved" && !message.message.content.match(regex1)) || (ticket.value.ticket.state === "awaiting info" && !message.message.content.match(regex2)))
    {
      reopenTicket();
    }
    comments.value.unshift(message);
  });

  // ** Poslušaj novo naložene datoteke**
  socket.on("newFileUploaded", (message) => {
    comments.value.unshift(message);
  });

  socket.on("disconnect", (reason) => {
    console.error("Socket odklopljen:", reason);
    if (reason === "transport close") {
      console.warn("Povezava zaprta. Poskus ponovne povezave...");
      setTimeout(() => {
        socket.connect(); // Ročno sproži reconnect
      }, 3000);
    }
  });
});

const getDataFunction = async () => {
  if (getData)
  {
    await loadUsers();
    await loadCompanies();
    await loadContracts();
    await loadGroups();
    await loadTickets();
    document.addEventListener("click", closeDropdowns);
    //document.removeEventListener("click", closeDropdowns)
    getData = !getData;
  }
};

// **Funkcija za prikaz podrobnosti**
const getDetails = (type: string, id: number) => {
  selectedType.value = type;
  selectedId.value = id;
  isDetailsModalOpen.value = true;
};

// **Funkcija za preusmerjanje na nadrejeni zahtevek
const redirectToParentTicket = () => {
  if (ticket.value.ticket.parent_ticket_id) {
    router.push({ name: 'TicketDetails', params: { id: ticket.value.ticket.parent_ticket_id } });
  }
};

</script>

<template>
  <div v-if="isLoading" class="content-wrapper">
    <p>Nalaganje zahtevka...</p>
  </div>

  <div v-if="!isLoading" class="content-wrapper">

    <div class="nav-ticket">
      <!-- Navigacija z gumbi -->
      <nav class="ticket-nav">
        <button :disabled="!isTicketEditable || ticket.ticket.state === 'new'" @click="saveChanges" class="btn-primary">Shrani</button>
        <button 
            v-if="!showResolutionForm && ticket.ticket.state === 'open'" 
            :disabled="!isTicketEditable"
            @click="toggleResolutionForm" 
            class="btn-warning">
            Razreši zahtevek
        </button>
        <button 
            v-else-if="showResolutionForm && ticket.ticket.state === 'open'"
            :disabled="!isTicketEditable"
            @click="resolveTicket" 
            class="btn-warning">
            Razreši zahtevek
        </button>
        <button 
          v-else-if="ticket.ticket.state === 'resolved' || ticket.ticket.state === 'closed' || ticket.ticket.state === 'awaiting info'"
          :disabled="!isTicketEditable && isTicketEditableClosed"
          @click="reopenTicket" 
          class="btn-warning">
          Odpri zahtevek
        </button>

        <button v-if="!showAwaitingInfoForm && ticket.ticket.state === 'open'" :disabled="!isTicketEditable" @click="toggleAwaitingInfoForm" class="btn-awaiting">Čakanje na odziv</button>
        <button v-else-if="showAwaitingInfoForm && ticket.ticket.state === 'open'" :disabled="!isTicketEditable" @click="saveChangesAwaiting" class="btn-awaiting">Čakanje na odziv</button>

        <button :disabled="!isTicketEditable" v-if="ticket.ticket.state !== 'cancelled' && ticket.ticket.state !== 'new'"
          @click="isWorkLogModalOpen = true"
          class="btn-secondary">
          Vpiši čas
        </button>
        <button :disabled="!isTicketEditable" v-if="((ticket.primary[0] === undefined && ticket.ticket.caller_id !== parseInt(currentUserId,10)) || (ticket.primary[0] !== undefined && ticket.primary[0].user_id !== parseInt(currentUserId,10) && ticket.ticket.caller_id !== parseInt(currentUserId,10))) && ticket.ticket.state !== 'cancelled'" 
          @click="assignToMe" 
          class="btn-success">
          Dodeli name
        </button>
        <button :disabled="!isTicketEditable" @click="cancelTicket" class="btn-danger">Prekliči zahtevek</button>
      </nav>
    </div>

    <!-- SLA indikator -->
    <div v-if="ticket.ticket.type === 'incident' && ticket.ticket.state === 'new' && !slaAccepted" 
        class="p-2 text-dark mb-2 rounded" 
        :style="{ backgroundColor: acceptSlaRemaining !== null && acceptSlaRemaining > 0 ? '#BCF180' : '#f8d7da' }">
      SLA za sprejem: 
      <span v-if="acceptSlaRemaining !== null && acceptSlaRemaining > 0">
        {{ dayjs.duration(acceptSlaRemaining).format('HH:mm:ss') }}
      </span>
      <span v-else>
        SLA za sprejem je bil prekoračen!
      </span>
    </div>


    <form class="ticket-form">
      <div class="form-row">
        <!-- ID -->
        <div class="form-group">
          <label for="caller">ID zahtevka</label>
            <input v-model="ticket.ticket.ticket_id" id="ticket_id" disabled />
        </div>

        <!-- Odprto dne -->
        <div class="form-group">
          <label for="date">Odprto</label>
            <input v-model="formattedDate" id="date" disabled />
        </div>
      </div>
        
      <div class="form-row">
        <!-- status -->
        <div class="form-group">
          <label for="status">Status</label>
            <input v-model="ticket.ticket.state" id="status" disabled />
        </div>
        <!-- Priority -->
        <div class="form-group">
          <label for="priority">Prioriteta</label>
          <input v-model="ticket.ticket.priority" id="priority" disabled />
        </div>
      </div>

      <div class="form-row">
        <!-- tip -->
        <div class="form-group">
          <label for="type">Tip zahtevka</label>
            <select :disabled="!isTicketEditable" id="type" v-model="ticket.ticket.type">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <!-- Impact -->
        <div class="form-group">
          <label for="impact">Vpliv</label>
          <select :disabled="!isTicketEditable" id="impact" v-model="ticket.ticket.impact" @change="getPriority">
            <option v-for="option in impactOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>  
      </div>

      <div class="form-row">
        <!-- Klicatelj -->
        <div class="form-group">
          <label for="caller">Klicatelj</label>
            <input :disabled="!isTicketEditable" v-model="callerSearch" id="caller" @focus="showDropdowns.caller = true" @input="getDataFunction" @dblclick="getDetails('caller', ticket.ticket.caller_id)" required />
            <ul v-if="showDropdowns.caller">
              <li v-for="user in filteredUsers" :key="user.id" @click="selectCaller(user)">
                {{ user.name }}
            </li>
          </ul>
        </div>
        <!-- Urgency -->
        <div class="form-group">
          <label for="urgency">Nujnost</label>
          <select :disabled="!isTicketEditable" id="urgency" v-model="ticket.ticket.urgency" @change="getPriority">
            <option v-for="option in urgencyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div> 
      </div>

      <div class="form-row">
        <!-- Podjetje -->
        <div class="form-group">
          <label for="company">Podjetje</label>
            <input :disabled="!isTicketEditable" v-model="companySearch" id="company" @focus="showDropdowns.company = true" @input="getDataFunction" @dblclick="getDetails('company', ticket.ticket.company_id)" required />
            <ul v-if="showDropdowns.company">
              <li v-for="company in filteredCompanies" :key="company.id" @click="selectCompany(company)">
                {{ company.name }}
              </li>
            </ul>
        </div>
        <!-- Skupina -->
        <div class="form-group">
          <label for="group">Assigment group</label>
            <div class="dropdown-container">
            <input :disabled="!isTicketEditable" id="group" v-model="groupSearch" @focus="showDropdowns.group = true" type="text" placeholder="Iskanje skupine" @input="getDataFunction" @dblclick="getDetails('group', ticket.ticket.group_id)" required />
            <ul v-if="showDropdowns.group">
              <li v-for="group in filteredGroups" :key="group.id" @click="selectGroup(group)">
                {{ group.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="form-row">
        <!-- Parent ticket -->
        <div class="form-group">
          <label for="parentTicket">Nadrejeni zahtevek</label>
          <div class="dropdown-container">         
            <input :disabled="!isTicketEditable" type="text" id="parentTicket" v-model="parentTicketSearch" @focus="showDropdowns.ticket = true" @input="getDataFunction" @dblclick="redirectToParentTicket" placeholder="Dodaj starševski zahtevek"/>
              <ul v-if="showDropdowns.ticket">
                <li v-for="ticket in filteredTickets" :key="ticket.id" @click="selectTicket(ticket)">
                  {{ ticket.id }} | {{ ticket.name }}
                </li>
              </ul>
          </div>
        </div>
        <!-- Inženir -->
        <div class="form-group">
          <label for="engineer">Reševalec</label>
          <input :disabled="!isTicketEditable" id="engineer" v-model="engineerSearch" @focus="showDropdowns.engineer = true" @input="getDataFunction" @dblclick="getDetails('assignee', ticket.primary[0].user_id)" required/>
          <ul v-if="showDropdowns.engineer">
            <li v-for="user in filteredEngineers" :key="user.id" @click="selectEngineer(user)">
              {{ user.name }}
            </li>
          </ul>
        </div>
      </div>  

      <div class="form-row">
        <!-- Pogodba -->
        <div class="form-group">
          <label for="contract">Pogodba</label>
          <div class="dropdown-container">
            <input :disabled="!isTicketEditable" v-model="contractSearch" id="contract" @focus="showDropdowns.contract = true" type="text" placeholder="Iskanje pogodbe" @input="getDataFunction" @dblclick="getDetails('contract', ticket.ticket.contract_id)" required />
            <ul v-if="showDropdowns.contract">
              <li v-for="contract in filteredContracts" :key="contract.id" @click="selectContract(contract)">
                {{ contract.name }} - {{ contract.status }} | {{ contract.description }}
              </li>
            </ul>
          </div>
        </div>
        <div class="form-group">
          <label>Dodatni reševalci</label>
            <div class="dropdown-container">
            <input :disabled="!isTicketEditable" v-model="resolverSearch" @focus="showDropdowns.additional = true" type="text" placeholder="Dodaj reševalca" @input="getDataFunction" />
            <ul v-if="showDropdowns.additional">
              <li v-for="user in filteredResolvers" :key="user.id" @click="addResolver(user)">
                {{ user.name }}
              </li>
            </ul>
          </div>
          <div v-if="additionalResolvers.length">
            <span @dblclick="getDetails('additional', resolver.id)" v-for="resolver in additionalResolvers" :key="resolver.id" class="resolver">
              {{ resolver.name }}
              <i v-if="isTicketEditable" class="fa-regular fa-circle-xmark remove-icon" @click="removeResolver(resolver)"></i>
            </span>
          </div>
        </div>
      </div>

      <!-- Naslov (čez celo širino) -->
      <div class="form-group full-width">
        <label for="title">Naslov zahtevka</label>
        <input :disabled="!isTicketEditable" type="text" id="title" v-model="ticket.ticket.title" required />
      </div>

      <!-- Opis (čez celo širino) -->
      <div class="form-group full-width">
        <label for="description">Opis</label>
        <textarea :disabled="!isTicketEditable" id="description" v-model="ticket.ticket.description" required></textarea>
      </div>

      <!-- Razslog za Accept SLA breach -->
      <div v-if="ticket.ticket.accept_sla_breach !== null" class="form-group full-width">
        <label>Razlog za prekoračitev spremnega SLA</label>
        <textarea disabled v-model="ticket.ticket.accept_sla_breach"></textarea>
      </div>

    </form>

    <br>

    <!-- Sekcija za zaprtje zahtevka -->
    <div v-if="showResolutionForm" id="resolution-section" class="resolution-form">
      <h3>Razrešitev</h3>

      <label>Koda razrešitve *</label>
      <select :disabled="!isTicketEditable" v-model="resolution.close_code">
        <option value="solved">Rešeno</option>
        <option value="duplicate">Podvojen</option>
        <option value="cancelled">Preklicano</option>
        <option value="other">Drugo</option>
      </select>

      <label>Opombe razrešitve *</label>
      <textarea :disabled="!isTicketEditable" v-model="resolution.close_notes"></textarea>

      <div class="resolution-checkbox">
        <label for="addResolutionToComments">Dodaj opombe razrešitve v komentarje</label>
        <input id="addResolutionToComments" type="checkbox" v-model="resolution.addToComments">
      </div>
      <br>
    </div>

     <!-- Sekcija za čakanje na odziv -->
     <div v-if="showAwaitingInfoForm" id="resolution-section1" class="resolution-form">
      <h3>Razlog za čakanje</h3>

      <textarea :disabled="!isTicketEditable" v-model="awaitingInfoReason"></textarea>
      <br><br>
     </div>

    <!-- Sekcija za komunikacijo -->
    <div class="ticket-comments">
      <h3>Komunikacija</h3>
      
      <!-- Vnos polja za javna in zasebna sporočila -->
      <div class="comment-inputs">
        <textarea :disabled="!isTicketEditable" v-model="newPublicComment" placeholder="Vnesi javni komentar..." class="input-field"></textarea>
        <div class="ticket-nav1">
          <button :disabled="!isTicketEditable" @click="sendComment(true)" class="btn-send">Pošlji</button>
        </div>

        <textarea :disabled="!isTicketEditable" v-model="newPrivateComment" placeholder="Vnesi zasebni komentar..." class="input-field"></textarea>
        <div class="ticket-nav1">
          <button :disabled="!isTicketEditable" @click="sendComment(false)" class="btn-send">Pošlji</button>
        </div>
      </div>

      <!-- Povleci in spusti za datoteke + možnost izbire datoteke -->
      <div class="file-upload">
        <div :disabled="!isTicketEditable" class="file-drop-zone" @dragover.prevent @drop="handleFileDrop">
          Povleci in spusti datoteko tukaj
        </div>
        <label class="file-label">
          <input :disabled="!isTicketEditable" type="file" accept=".jpg, .jpeg, .png, .pdf" @change="handleFileSelect" hidden />
          Izberi datoteko
        </label>
      </div>

      <div v-if="uploadedFile" class="uploaded-file">
        Pripravljeno za pošiljanje: {{ uploadedFile.name }}
      </div>

      <!-- Število sporočil -->
      <div class="comment-count">
        Javni komentarji: {{ comments.filter(c => c.private === false).length }} | Zasebni komentarji: {{ comments.filter(c => c.private === true).length }}
      </div>

      <!-- Seznam komentarjev -->
      <ul class="comment-list">
        <li v-for="comment in comments" :key="comment.created_at" :class="{
            'public-comment': comment.private === false,
            'private-comment': comment.private === true
          }">
          <strong>
            <i class="bi" :class="comment.private === false ? 'bi-globe' : 'bi-lock'"></i>
            {{ comment.name }}
            <span class="date">{{ formatDate(comment.created_at) }}</span>
          </strong>

          <br><br>

          <p v-if="comment.message && comment.message.type === 'text'" class="comment-text">
            {{ comment.message.content }}
          </p>

          <img v-else-if="comment.message.type === 'image'" :src="comment.message.content" style="max-width: 40%; border-radius: 5px;" />

          <a v-else class="file-link" @click.prevent="openDocument(comment.message.content, comment.message.filename)">
            <i class="bi bi-file-earmark-pdf"></i> {{ comment.message.filename || "Odpri dokument" }}
          </a>
        </li>
        <li></li>
      </ul>
    </div>

    <!-- Modal za beleženje časa -->
    <WorkLogModal v-if="isWorkLogModalOpen" 
              @close="isWorkLogModalOpen = false"
              :ticketId="ticketId.toString()"
              :userId="currentUserId.toString()" />

    <!-- Modal za prikaz podrobnosti -->
    <DetailsModal v-if="isDetailsModalOpen" :type="selectedType" :id="selectedId.toString()" @close="isDetailsModalOpen = false" />        

    <!-- Modal za SLA accept breach -->
    <SlaBreachModal
      v-if="ticket.ticket.type === 'incident' && ticket.ticket.state === 'new' && !slaAccepted"
      v-model="showSlaBreachModal"
      @reason-submitted="submitSlaBreachReason"
    />

  </div>
</template>

<style scoped>
.content-wrapper {
    margin-left: 250px; /* Enako širini sidebarja */
    padding: 20px;
    width: calc(100% - 250px);
}

.comment-list {
    list-style-type: none;
    padding: 0;
    margin-left: 0px;
    margin-right: 0px;
    width: calc(100% - 280px);
  }

.ticket-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  border-bottom: 2px solid #ddd;
  z-index: 1000; 
}

.nav-ticket {
  margin-bottom: 60px;
}

@media (max-width: 768px) {
    .content-wrapper {
        margin-top: 50px;
        margin-left: 0; /* Če je sidebar skrit */
        width: 100%;
    }

    .comment-list {
      width: calc(100% - 30px);
    }

    .ticket-nav {
      position: fixed;
      top: 58px;
      left: 0;
    }
  }

.ticket-nav1 {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 15px;
}

.sla-indicator {
  background: red;
  color: white;
  padding: 10px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
}

.dropdown-container ul {
  max-height: 200px; /* Nastavi maksimalno višino dropdowna */
  overflow-y: auto; /* Omogoči vertikalni scroll, če vsebina preseže višino */
  border: 1px solid #ccc; /* Doda rob za vizualno ločitev */
  background: white; /* Ozadje */
  padding: 0;
  margin: 0;
  position: absolute;
  width: auto;
  z-index: 1000; /* Poskrbi, da je dropdown nad ostalimi elementi */
}

.dropdown-container li {
  padding: 10px;
  cursor: pointer;
}

.dropdown-container li:hover {
  background: #f0f0f0;
}

/* Postavitev dveh stolpcev */
.form-row {
  display: flex;
  gap: 20px;
}

.file-upload {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.full-width {
  width: 100%;
}

label {
  display: block;
  font-weight: bold;
}

input, select, textarea, ul, li {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border-radius: 5px;
}

textarea {
  min-height: 150px;
}

ul {
  list-style: none;
  background: white;
  padding: 0;
  margin: 0;
  position: absolute;
  width: auto;
}

li {
  padding: 10px;
  cursor: pointer;
}

li:hover {
  background: #f0f0f0;
}

.resolver {
  display: inline-flex;
  align-items: center;
  background: #4DD6AA;
  color: white;
  border: none;
  margin: 5px;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.remove-icon {
  margin-left: 8px;
  color: red;
  cursor: pointer;
}

/* Responsive design */
@media (max-width: 1000px) {
  .form-row {
    flex-direction: column;
  }
}

.input-field {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.btn-primary {
  background-color: #00B0BE;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-secondary {
  background-color: #746EBC;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-success {
  background-color: #994F97;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-warning {
  background-color: #009FCD;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-danger {
  background-color: #A63264;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.submit-btn {
  background-color: #00B0BE;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.btn-awaiting {
  background-color: #3A89CE;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.comment-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-drop-zone {
  border: 2px dashed #00B0BE;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  flex-grow: 1;
}

.uploaded-file {
  color: green;
  font-weight: bold;
  margin-top: 5px;
}

.comment-count {
  margin-top: 10px;
  font-weight: bold;
}

.comment-list li {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  margin-top: 10px;
  border-radius: 10px;
}

.public-comment {
  background-color: #e6f7ff;
  border-left: 5px solid #00B0BE;
}

.private-comment {
  background-color: #fff3e6;
  border-left: 5px solid #ff7b00;
}

.file-link {
  display: block;
  margin-top: 5px;
  color: #00B0BE;
  text-decoration: none;
}

.file-link {
  display: block;
  margin-top: 5px;
  color: #00B0BE;
  text-decoration: none;
}

.file-label {
  display: inline-block;
  background-color: #746EBC;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  text-align: center;
}

.btn-send {
  background-color: #00B0BE;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: fit-content;
  text-align: center;
}

.date {
  float: right;
}

.resolution-checkbox {
  display: flex;
  align-items: center;
  gap: 10px; /* Razmik med besedilom in checkboxom */
}

.resolution-checkbox input {
  width: 16px;
  height: 16px;
}

.comment-text {
  white-space: pre-line; /* Omogoči prelom vrstic */
}

</style>
