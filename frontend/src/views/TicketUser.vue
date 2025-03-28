<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../stores/authStore';
import { loadMyTicketById, uploadChatFile } from '@/api/api';
import { io } from 'socket.io-client';

const route = useRoute();
const authStore = useAuthStore();

const ticket = ref<any>(null);
const isLoading = ref(true);
const isTicketEditable = ref(true);
const comments = ref<any[]>([]);

const ticketId = ref<any>(null);
const newPublicComment = ref('');
const uploadedFile = ref<File | null>(null);

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

// ** Trenutni uporabnik
const currentUserId = ref<string>('');

const getUserIdFromJWT = () => {
  
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

// **Formatiranje datuma**
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// **Preslikava prioritet**
const priorityMap: { [key: string]: { text: string; color: string } } = {
  "1": { text: "P1 - Kritična", color: "red" },
  "2": { text: "P2 - Visoka", color: "orange" },
  "3": { text: "P3 - Srednja", color: "green" },
  "4": { text: "P4 - Nizka", color: "green" }
};

onMounted(async () => {
  try {
    ticketId.value = route.params.id.toString();
    currentUserId.value = getUserIdFromJWT() || '';
    const response = await loadMyTicketById(currentUserId.value, ticketId.value);
    ticket.value = response[0];
    
    socket.emit("joinTicket", ticketId.value); // Pridruži se sobi WebSocket-a

    // Pridobi pretekle komentarje preko WebSocket-a
    socket.on("chatHistory", (messages) => {
        comments.value = messages;
    });

    // ** Poslušaj nova sporočila v realnem času**
    socket.on("newMessage", (message) => {
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

  } catch (error) {
    console.error('Napaka pri nalaganju zahtevka:', error)
  } finally {
    isLoading.value = false;
  }
});

const sendComment = async (isPublic: boolean) => {
  if (!newPublicComment.value.trim() && !uploadedFile.value) return;

  let messageData: any = {
    ticket_id: ticketId.value,
    isPrivate: false,
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
      content: newPublicComment.value,
    };

    socket.emit("sendMessage", messageData, (ack: any) => {
      if (ack?.success) {
        newPublicComment.value = "";
      }
    });
  }
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
</script>

<template>
  <div v-if="isLoading" class="content-wrapper">
    <p>Nalaganje zahtevka...</p>
  </div>

  <div v-if="!isLoading" class="content-wrapper">
    <!-- Glavni del incidenta -->
    <div class="card">
        <div class="incident-header">
            <div class="incident-number">
                <strong>Številka zahtevka: </strong>
                {{ ticket.ticket_id }}
            </div>
            <div class="incident-extra-fields">
                <div class="incident-field">
                <label>Ustvarjeno</label>
                <div>{{ formatDate(ticket.created_at) }}</div>
                </div>
                <div class="incident-field">
                <label>Posodobljeno</label>
                <div>{{ formatDate(ticket.updated_at) }}</div>
                </div>
                <div class="incident-field">
                <label>Status</label>
                <div>{{ ticket.state }}</div>
                </div>
            </div>
        </div>


      <h2 class="incident-title1">
        {{ ticket.title }}
      </h2>
      <h2 class="incident-title2">
        {{ ticket.description }}
      </h2>

      <div class="form-row">
        <div class="form-group">
          <label>Reševalec</label>
          <div>{{ ticket.primary_resolver }}</div>
        </div>
        <div class="form-group">
          <label>Klicatelj</label>
          <div>{{ ticket.caller }}</div>
        </div>
        <div class="form-group">
          <label>Prioriteta</label>
          <div>{{ priorityMap[ticket.priority].text }}</div>
        </div>
        <div class="form-group">
          <label>Tip</label>
          <div>{{ ticket.type }}</div>
        </div>
      </div>
    </div>

    <!-- Sekcija za komunikacijo -->
    <div class="ticket-comments">
      <h3>Komunikacija</h3>
      
      <!-- Vnos polja za javna in zasebna sporočila -->
      <div class="comment-inputs">
        <textarea :disabled="!isTicketEditable" v-model="newPublicComment" placeholder="Vnesi komentar..." class="input-field"></textarea>
        <div class="ticket-nav1">
          <button :disabled="!isTicketEditable" @click="sendComment(true)" class="btn-send">Pošlji</button>
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
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-left: 250px;
  padding: 20px;
  width: calc(100% - 250px);
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

.card {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}

.incident-title1 {
  background-color: #3A89CE;
  color: white;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  white-space: normal; /* omogoči prelom */
  word-break: break-word; /* prelom tudi sredi dolgih besed */
}

.incident-title2 {
  background-color: white;
  color: black;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  border: 1px solid #00B0BE;
  white-space: normal; /* omogoči prelom */
  word-break: break-word; /* prelom tudi sredi dolgih besed */
}

.incident-number {
  font-size: 14px;
  color: gray;
  margin-bottom: 10px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 15px;
}

.form-group {
  flex: 1;
  min-width: 150px;
}

label {
  display: block;
  font-weight: bold;
}

.input-field {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
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
  font-size: 12px;
  color: gray;
}

@media (max-width: 768px) {
  .content-wrapper {
    margin-top: 50px;
    margin-left: 0;
    width: 100%;
  }

  .comment-list {
    width: calc(100% - 30px);
  }
}

.incident-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.incident-extra-fields {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.incident-field {
  font-size: 14px;
  color: gray;
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

input, select, textarea, ul, li {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border-radius: 5px;
}

.file-upload {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.ticket-nav1 {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 15px;
}

ul {
  list-style: none;
}
</style>



