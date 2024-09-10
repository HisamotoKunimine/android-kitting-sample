// External libraries
import { makeAutoObservable } from "mobx";

// External modules
import { Adb, AdbDaemonDevice } from "@yume-chan/adb";

export class GlobalState {
  device: AdbDaemonDevice | undefined = undefined;
  adb: Adb | undefined = undefined;

  constructor() {
    makeAutoObservable(this, {});
  }

  setDevice(device: AdbDaemonDevice, adb: Adb) {
    this.device = device;
    this.adb = adb;
  }

  clearDevice() {
    this.device = undefined;
    this.adb = undefined;
  }

  isConnectedDevice(): boolean {
    return this.adb !== undefined;
  }
}

export const GLOBAL_STATE = new GlobalState();
