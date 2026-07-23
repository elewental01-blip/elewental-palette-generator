import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) =>
      ipcRenderer.send(channel, ...args),
    on: (channel: string, func: (event: Event, ...args: unknown[]) => void) =>
      ipcRenderer.on(channel, func),
    once: (channel: string, func: (event: Event, ...args: unknown[]) => void) =>
      ipcRenderer.once(channel, func),
  },
});