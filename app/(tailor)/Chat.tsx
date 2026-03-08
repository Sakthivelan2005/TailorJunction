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

export default function TailorChatScreen() {
  const { orderId, receiverId } = useLocalSearchParams();
  const { userId, API_URL, socket } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchChatHistory();

    if (socket) {
      const handleReceiveMessage = (messageData: any) => {
        // 🚀 FIX 1: Safely compare as Strings so "32" === "32"
        if (String(messageData.order_id) === String(orderId)) {
          // 🚀 FIX 2: Only add incoming messages if they are NOT from me
          if (String(messageData.sender_id) !== String(userId)) {
            setMessages((prev) => [...prev, messageData]);
            console.log("Message received by Tailor: ", messageData);
            pushNotification("Message from Customer", messageData.message);
          }
        }
      };

      socket.on("receiveMessage", handleReceiveMessage);
      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
      };
    }
  }, [socket, orderId, userId]); // 🚀 Added userId to dependencies!

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const msgPayload = {
      order_id: Number(orderId),
      sender_id: userId, // Tailor ID
      receiver_id: receiverId, // Customer ID
      message: newMessage.trim(),
    };

    // 🚀 FIX 3: Optimistic UI - Instantly show the message on our own screen!
    setMessages((prev) => [...prev, msgPayload]);
    setNewMessage(""); // Clear input instantly

    try {
      // 1. Emit to socket for instant delivery to Customer
      if (socket) {
        console.log("Sent from Tailor: ", msgPayload);
        socket.emit("sendMessage", msgPayload);
      }

      // 2. Save to database quietly in the background (No 'await'!)
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
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
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
          // 🚀 FIX 4: Convert both to strings before comparing so left/right aligns correctly
          const isMe = String(msg.sender_id) === String(userId);

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
          placeholder="Type a message to the customer..."
          placeholderTextColor="#000"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  chatArea: { flex: 1, padding: 15 },
  systemText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginVertical: 10,
  },
  messageWrapper: { marginVertical: 5, width: "100%", flexDirection: "row" },
  messageRight: { justifyContent: "flex-end" },
  messageLeft: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: "#3b82f6", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#e2e8f0", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14 },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: "#000",
  },
  sendBtn: {
    backgroundColor: "#3b82f6",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
