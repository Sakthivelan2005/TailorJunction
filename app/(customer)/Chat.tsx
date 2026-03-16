import { useAuth } from "@/context/AuthContext";
import { pushNotification } from "@/utils/notificationConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CustomerChatScreen() {
  const params = useLocalSearchParams();
  const { userId, API_URL, socket } = useAuth();

  // 🚀 FIX 1: Safely extract IDs and handle multiple possible key names
  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  // Catch receiverId, tailorId, or tailor_id to prevent "undefined" rooms
  const rawReceiver = params.receiverId || params.tailorId || params.tailor_id;
  const receiverId = Array.isArray(rawReceiver) ? rawReceiver[0] : rawReceiver;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchChatHistory();

    if (!socket || !userId) return;

    // 🚀 THE FIX: A dedicated function to join the room safely without spaces
    const joinRoom = () => {
      const safeRoomId = String(userId).trim();
      socket.emit("joinUserRoom", safeRoomId);
      console.log(`🔌 Socket Connected & Customer Joined Room: ${safeRoomId}`);
    };

    // 1. Join immediately when the screen opens
    joinRoom();

    // 2. 🚀 THE MAGIC: Re-join automatically if the connection drops and reconnects!
    socket.on("connect", joinRoom);

    const handleReceiveMessage = (messageData: any) => {
      console.log("👀 RAW SOCKET EVENT HIT CUSTOMER:", messageData);

      // 🚀 Apply .trim() everywhere to guarantee flawless matching
      if (String(messageData.order_id).trim() === String(orderId).trim()) {
        if (String(messageData.sender_id).trim() !== String(userId).trim()) {
          setMessages((prev) => [...prev, messageData]);
          console.log("✅ Message added to Customer UI!");
          pushNotification("New Message from Tailor", messageData.message);
        } else {
          console.log("❌ Ignored: Sender ID matches my own Customer ID.");
        }
      } else {
        console.log(
          `❌ Ignored: Message order_id (${messageData.order_id}) doesn't match screen orderId (${orderId})`,
        );
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    // Cleanup listeners when leaving the screen
    return () => {
      socket.off("connect", joinRoom);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, orderId, userId]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !receiverId) return;

    // 🚀 FIX 3: Force everything to String and trim spaces for Socket.io room matching
    const msgPayload = {
      order_id: Number(orderId),
      sender_id: String(userId).trim(),
      receiver_id: String(receiverId).trim(), // Now correctly targets the Tailor's room
      message: newMessage.trim(),
    };

    console.log("📤 Customer Sending Payload:", msgPayload);

    // Optimistic UI update
    setMessages((prev) => [...prev, msgPayload]);
    setNewMessage("");

    try {
      // 1. Emit for instant delivery
      if (socket) {
        socket.emit("sendMessage", msgPayload);
      }

      // 2. Persistent storage in DB
      fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgPayload),
      }).catch((err) => console.error("DB Save Error:", err));
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{`Order #${orderId} Chat`}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        style={styles.chatArea}
      >
        <Text style={styles.systemText}>
          Chat closes 24 hours after completion.
        </Text>

        {messages.map((msg, index) => {
          const isMe = String(msg.sender_id).trim() === String(userId).trim();

          return (
            <View
              key={index}
              style={[
                styles.messageWrapper,
                isMe ? styles.messageRight : styles.messageLeft,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMe ? styles.bubbleMe : styles.bubbleThem,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMe ? { color: "#fff" } : { color: "#000" },
                  ]}
                >
                  {msg.message}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message to the tailor..."
          placeholderTextColor="#94a3b8"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline={false}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            !newMessage.trim() && { backgroundColor: "#cbd5e1" },
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a8a" },
  chatArea: { flex: 1, padding: 15 },
  systemText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginVertical: 10,
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 8,
    alignSelf: "center",
    paddingHorizontal: 12,
  },
  messageWrapper: { marginVertical: 5, width: "100%", flexDirection: "row" },
  messageRight: { justifyContent: "flex-end" },
  messageLeft: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 18 },
  bubbleMe: { backgroundColor: "#3b82f6", borderBottomRightRadius: 2 },
  bubbleThem: { backgroundColor: "#e2e8f0", borderBottomLeftRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    color: "#1e293b",
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: "#3b82f6",
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});
