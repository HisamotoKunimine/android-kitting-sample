// External libraries
import React from "react";
import { observer } from "mobx-react-lite";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

// Internal modules
import { GLOBAL_STATE } from "@/state/global-state";
import { KittingState } from "@/state/kitting-state";

const kittingState = new KittingState();

const completedCloseHandle = () => {
  GLOBAL_STATE.clearDevice();
  kittingState.clearCompleted();
};

function _Kitting(): React.JSX.Element | null {
  return (
    <Stack>
      <Typography fontSize={24} sx={{ marginTop: 6 }}>
        Step4 - Kitting
      </Typography>
      <Button
        variant="contained"
        disabled={!GLOBAL_STATE.isConnectedDevice() || kittingState.isRunning}
        onClick={() => {
          kittingState.start();
        }}
        sx={{ width: "50%", marginTop: 1 }}
      >
        Start
      </Button>

      <Dialog open={kittingState.isRunning && GLOBAL_STATE.isConnectedDevice()}>
        <DialogTitle id="alert-dialog-title" sx={{ minWidth: 500 }}>
          Kitting in progress...
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do not disconnect USB cables
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <Dialog open={kittingState.isCompleted}>
        {/*<DialogTitle id="complete-dialog-title">Completed</DialogTitle>*/}
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Completed
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={completedCloseHandle}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export const Kitting = observer(_Kitting);
