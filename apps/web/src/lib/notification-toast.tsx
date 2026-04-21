import { toast } from "sonner";
import { CircleCheckIcon, CircleXIcon, InfoIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Notification = {
  type: string;
  title: string;
  message: string;
};

type ToastFn = typeof toast.success;

type Entry = {
  fn: ToastFn;
  icon: LucideIcon;
  cls: string;
};

const registry: Record<string, Entry> = {
  PAYMENT_FAILED: { fn: toast.error, icon: CircleXIcon, cls: "text-red-500" },
  SUBSCRIPTION_RENEWAL_FAILED: { fn: toast.error, icon: CircleXIcon, cls: "text-red-500" },
  SUBSCRIPTION_STARTED: { fn: toast.success, icon: CircleCheckIcon, cls: "text-green-500" },
  SUBSCRIPTION_RENEWED: { fn: toast.success, icon: CircleCheckIcon, cls: "text-green-500" },
};

const fallback: Entry = { fn: toast.info, icon: InfoIcon, cls: "text-blue-500" };

export const showNotification = (n: Notification) => {
  const { fn, icon: Icon, cls } = registry[n.type] ?? fallback;
  fn(n.title, {
    description: n.message,
    icon: <Icon className={`size-4 ${cls}`} />,
  });
};
