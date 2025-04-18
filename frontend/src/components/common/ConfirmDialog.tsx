import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  confirmButtonColor?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmButtonText,
  cancelButtonText = 'Cancel',
  confirmButtonColor = 'primary',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby='confirm-dialog-title'
      aria-describedby='confirm-dialog-description'
      PaperProps={{
        style: {
          backgroundColor: '#4b5563',
          color: 'white',
          boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.4)',
          opacity: 1,
        },
      }}
    >
      <DialogTitle id='confirm-dialog-title'>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          id='confirm-dialog-description'
          sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color='inherit'>
          {cancelButtonText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmButtonColor}
          variant='contained'
          autoFocus
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
