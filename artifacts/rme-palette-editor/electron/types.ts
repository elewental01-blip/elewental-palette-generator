export interface IElectronAPI {
  platform: string;
  nodeVersion: string;
  chromeVersion: string;
  electronVersion: string;
}

declare global {
  interface Window {
    electron?: IElectronAPI;
  }
}