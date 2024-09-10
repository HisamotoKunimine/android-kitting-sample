// External libraries
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";

// External modules
import {
  Adb,
  AdbDaemonDevice,
  AdbDaemonTransport,
  AdbPacketData,
  AdbPacketInit,
} from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import {
  AdbDaemonWebUsbDeviceManager,
  AdbDaemonWebUsbDeviceWatcher,
} from "@yume-chan/adb-daemon-webusb";
import {
  Consumable,
  InspectStream,
  pipeFrom,
  ReadableStream,
  WritableStream,
} from "@yume-chan/stream-extra";

// Internal modules
import { GLOBAL_STATE } from "@/state/global-state";

const CredentialStore = new AdbWebCredentialStore();

function _Connect(): React.JSX.Element | null {
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<
    AdbDaemonDevice | undefined
  >();
  const [usbSupported, setUsbSupported] = useState(true);
  const [usbDeviceList, setUsbDeviceList] = useState<AdbDaemonDevice[]>([]);
  const updateUsbDeviceList = useCallback(async () => {
    const devices: AdbDaemonDevice[] =
      await AdbDaemonWebUsbDeviceManager.BROWSER!.getDevices();
    setUsbDeviceList(devices);
    return devices;
  }, []);

  useEffect(() => {
    const supported = !!AdbDaemonWebUsbDeviceManager.BROWSER;
    setUsbSupported(supported);
    if (!supported) {
      console.log("This browser does not support WebUSB");
      return;
    }
    updateUsbDeviceList();

    return () =>
      new AdbDaemonWebUsbDeviceWatcher(async (serial?: string) => {
        if (serial) {
          setSelectedDevice(
            (await updateUsbDeviceList()).find(
              (device) => device.serial === serial
            )
          );
          return;
        }
      }, globalThis.navigator.usb).dispose();
  }, []);

  const handleSelectedBackendChange = (
    event: SelectChangeEvent,
    child?: ReactNode
  ) => {
    const adbBackend = backendOptions.find((d) => {
      return d.data.serial === event.target.value;
    })?.data;
    setSelectedDevice(adbBackend);
  };

  const addUsbDevice = useCallback(async () => {
    const device = await AdbDaemonWebUsbDeviceManager.BROWSER!.requestDevice();
    setSelectedDevice(device);
    await updateUsbDeviceList();
  }, [updateUsbDeviceList]);

  const connect = useCallback(async () => {
    if (!selectedDevice) {
      return;
    }

    setConnecting(true);

    let readable: ReadableStream<AdbPacketData>;
    let writable: WritableStream<Consumable<AdbPacketInit>>;
    try {
      const streams = await selectedDevice.connect();
      readable = streams.readable.pipeThrough(
        new InspectStream((packet) => {
          console.log(packet);
        })
      );

      writable = pipeFrom(
        streams.writable,
        new InspectStream((packet: Consumable<AdbPacketInit>) => {
          console.log(packet);
        })
      );
    } catch (e: any) {
      setConnecting(false);
      // Terminate programs that use adb and run adb kill-server
      // e.g. AndroidStudio, Vysor, MacDroid
      setConnectionError(true);
      return;
    }

    async function dispose() {
      try {
        await readable.cancel().catch();
      } catch (e) {}
      try {
        await writable.close().catch();
      } catch (e) {}
      GLOBAL_STATE.clearDevice();
    }

    try {
      const adb = new Adb(
        await AdbDaemonTransport.authenticate({
          serial: selectedDevice.serial,
          connection: { readable, writable },
          credentialStore: CredentialStore,
        })
      );

      adb.disconnected.then(async () => {
        await dispose();
      });
      GLOBAL_STATE.setDevice(selectedDevice, adb);
    } catch (e: any) {
      await dispose();
    } finally {
      setConnecting(false);
    }
  }, [selectedDevice]);

  const disconnect = useCallback(async () => {
    await GLOBAL_STATE.adb?.close().catch((e) => {
      console.error(e);
    });
  }, []);

  const backendOptions = useMemo(() => {
    return usbDeviceList.map((usbDevice) => ({
      key: usbDevice.serial,
      text: `${usbDevice.serial} ${
        usbDevice.name ? `(${usbDevice.name})` : ""
      }`,
      data: usbDevice,
    }));
  }, [usbDeviceList]);

  useEffect(() => {
    setSelectedDevice((old) => {
      if (old) {
        const current = usbDeviceList.find(
          (usbDevice) => usbDevice.serial === old.serial
        );
        if (current) {
          return current;
        }
      }

      return usbDeviceList.length ? usbDeviceList[0] : undefined;
    });
  }, [usbDeviceList]);

  return (
    <Stack>
      <Stack direction="column">
        <Typography fontSize={24}>Step1 - Pairing</Typography>
        <Button
          variant="contained"
          disabled={!usbSupported || GLOBAL_STATE.isConnectedDevice()}
          onClick={addUsbDevice}
          sx={{ width: "50%", marginTop: 1 }}
        >
          Pairing
        </Button>

        <Typography fontSize={24} sx={{ marginTop: 6 }}>
          Step2 - Device Selection
        </Typography>
        <FormControl sx={{ width: "100%", marginTop: 1 }}>
          <InputLabel id="device-select" sx={{ color: "lightgray" }}>
            Device
          </InputLabel>
          <Select
            labelId="device-select"
            value={selectedDevice?.serial ? selectedDevice?.serial : ""}
            label="Device"
            onChange={handleSelectedBackendChange}
            disabled={!!GLOBAL_STATE.adb || backendOptions.length === 0}
          >
            {backendOptions.map((value) => (
              <MenuItem key={value.data.serial} value={value.data.serial}>
                {value.text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography fontSize={24} sx={{ marginTop: 6 }}>
          Step3 - Device Connection
        </Typography>
        <Button
          variant="contained"
          disabled={!selectedDevice}
          onClick={GLOBAL_STATE.adb ? disconnect : connect}
          sx={{ width: "50%" }}
        >
          {GLOBAL_STATE.adb ? "Disconnect" : "Connect"}
        </Button>
      </Stack>

      <Dialog open={connecting}>
        <DialogTitle id="alert-dialog-title">{"Connecting..."}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Allow USB debugging
          </DialogContentText>
          <LinearProgress sx={{ mt: 2 }} />
        </DialogContent>
      </Dialog>
      <Dialog open={connectionError}>
        <DialogTitle id="alert-dialog-title">{"Connection Error"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Terminate programs that use adb and run adb kill-server
            <br />
            e.g. AndroidStudio, Vysor, MacDroid
          </DialogContentText>
          <DialogActions>
            <Button
              onClick={() => {
                setConnectionError(false);
              }}
            >
              Close
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

export const Connect = observer(_Connect);
