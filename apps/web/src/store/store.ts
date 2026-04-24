import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import notificationsReducer from "@/store/slices/notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
  },
  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
