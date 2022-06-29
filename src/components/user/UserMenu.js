import { Logout, Settings } from "@mui/icons-material";
import { Avatar, Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useValue } from "../../context/ContextProvider";

export default function UserMenu({ anchorElUser, setAnchorElUser }) {
    const {
        state: { currentUser },
        dispatch
    } = useValue()

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget)
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null)
    };

    return (
        <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={currentUser?.name} src={currentUser?.photoURL}>
                        {currentUser?.name.charAt(0).toUpperCase()}
                    </Avatar>
                </IconButton>
            </Tooltip>
            <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                onClick={handleCloseUserMenu}
            >
                <MenuItem key="profile" onClick={handleCloseUserMenu}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem key="logout" onClick={() => dispatch({ type: 'UPDATE_USER', payload: null })}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Logout</Typography>
                </MenuItem>

            </Menu>
        </Box>
    )
}
