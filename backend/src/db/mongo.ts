import mongoose, { Schema, Document, Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Nastavimo povezavo na MongoDB
const mongoUri: string = process.env.MONGO_URI || 'mongodb://localhost:27017/tikit';

if (!mongoUri) {
  throw new Error('Napaka: MONGO_URI ni določen v .env datoteki!');
}

// **Definiramo vmesnik za model chat**
interface IMessageContent {
  type: 'text' | 'image' | 'document';
  content: string | Buffer;
}

interface IChat extends Document {
  ticket_id: number;
  message: IMessageContent;
  private: boolean;
  created_at: Date;
  name: string;
}

// **Shema za "chat"**
const ChatSchema: Schema = new Schema({
  ticket_id: {
    type: Number,
    required: true,
    description: 'ID povezanega zahtevka'
  },
  message: {
    type: {
      type: String,
      enum: ['text', 'image', 'document'],
      required: true,
      description: 'Vrsta sporočila'
    },
    content: {
      type: Schema.Types.Mixed, // Lahko je string (besedilo/URL) ali binarni podatek
      required: true,
      description: 'Vsebina sporočila'
    }
  },
  private: {
    type: Boolean,
    required: true,
    description: 'Označuje, ali je sporočilo zasebno (vidno samo inženirjem) ali javno (vidno tudi klicatelju)'
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
    description: 'Čas ustvarjanja sporočila'
  },
  name: {
    type: String,
    required: true,
    description: 'Ime uporabnika, ki je poslal sporočilo',
    default: 'Sistem'
  }
});

// **Ustvari model za "chat" ali poveži na obstoječega**
const ChatModel: Model<IChat> = mongoose.models.chat || mongoose.model<IChat>('chat', ChatSchema, 'chat');

// **Funkcija za povezavo z MongoDB**
const connectMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoUri);
    console.log(`Povezan na MongoDB: ${mongoUri}`);
  } catch (error) {
    console.error('Napaka pri povezavi na MongoDB:', error);
  }
};

// **Funkcija za pridobitev chat podatkov glede na določen `ticket_id`**
export const getChatsByTicketId = async (ticketId: number, /*privateMessage: boolean*/): Promise<IChat[]> => {
  try {
      const chats = await ChatModel.find({ ticket_id: ticketId/*, private: privateMessage*/ })
          .sort({ created_at: -1 }) // Sortiranje, najnovejši najprej
          .lean(); // Vrne običajne objekte namesto Mongoose dokumentov

      /*if (chats.length === 0) {
          throw new Error(`Za ticket_id=${ticketId} ni najdenih chat sporočil!`);
      }*/

      return chats.map(chat => ({
          ticket_id: chat.ticket_id,
          message: {
              type: chat.message.type,
              content: chat.message.type === 'document' ? chat.message.content.toString('base64') : chat.message.content
          },
          private: chat.private,
          created_at: chat.created_at,
          name: chat.name
      })) as unknown as IChat[];
  } catch (error) {
      console.error(`Napaka pri pridobivanju podatkov za ticket_id=${ticketId}:`, error);
      throw error;
  }
};

// **Funkcija za ustvarjanje novega chat sporočila v MongoDB**
export const createChat = async (ticket_id: number, message: { type: string, content: string | Buffer }, isPrivate: boolean, name: string ) => {
  try {
      const newChat = new ChatModel({
          ticket_id,
          message,
          private: isPrivate,
          created_at: new Date(), // Samodejno nastavi trenutno uro ob ustvarjanju
          name
      });

      return await newChat.save();
  } catch (error) {
      console.error('Napaka pri shranjevanju chat sporočila v MongoDB:', error);
      throw error;
  }
};

export default connectMongo;
