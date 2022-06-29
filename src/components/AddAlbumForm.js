import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'

export default function AddAlbumForm({ open, handleClose }) {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Add album</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Fill the form to add album.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="artist"
                    label="Artist"
                    type="text"
                    fullWidth
                    variant="standard"
                />
                <TextField
                    autoFocus
                    margin="dense"
                    id="title"
                    label="Title"
                    type="text"
                    fullWidth
                    variant="standard"
                />
                <TextField
                    margin="dense"
                    id="releaseDate"
                    label="Release Date"
                    type="date"
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleClose}>Add</Button>
            </DialogActions>
        </Dialog>
    )
}
