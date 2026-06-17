import { toast } from "sonner";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import type { IconType } from "react-icons";

export type Notification = {
  type: string;
  title: string;
  message: string;
};

type ToastFn = typeof toast.success;

type Entry = {
  fn: ToastFn;
  icon: IconType;
  cls: string;
};

const registry: Record<string, Entry> = {
  PAYMENT_FAILED: { fn: toast.error, icon: FaTimesCircle, cls: "text-red-500" },
  SUBSCRIPTION_RENEWAL_FAILED: { fn: toast.error, icon: FaTimesCircle, cls: "text-red-500" },
  SUBSCRIPTION_STARTED: { fn: toast.success, icon: FaCheckCircle, cls: "text-green-500" },
  SUBSCRIPTION_RENEWED: { fn: toast.success, icon: FaCheckCircle, cls: "text-green-500" },
};

const fallback: Entry = { fn: toast.info, icon: FaInfoCircle, cls: "text-blue-500" };

export const showNotification = (n: Notification) => {
  const { fn, icon: Icon, cls } = registry[n.type] ?? fallback;
  fn(n.title, {
    description: n.message,
    icon: <Icon className={`size-4 ${cls}`} />,
    closeButton: true,
  });
};
