import { AlertColor } from "@mui/material";

export interface CommonComponentProps {
  darkModeEnabled: boolean;
  showMessage: ((content:string, severity?:AlertColor) => void);
  copyToClipboard: ((content:string, hint?:string) => void);
}