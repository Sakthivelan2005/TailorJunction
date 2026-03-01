import * as Notifications from "expo-notifications";
import { useEffect } from "react";

type NotificationProps = {
  title: string;
  message: string;
  sound?: boolean;
};

const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  sound = true,
}) => {
  useEffect(() => {
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: sound ? "default" : undefined,
      },
      trigger: null, // immediate system notification
    });
  }, [title, message, sound]);

  return null; // no UI
};

export default Notification;
