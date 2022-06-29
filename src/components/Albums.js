import * as React from 'react'
import { Button, CssBaseline, Stack, Box, Typography, Container } from '@mui/material'

import AddAlbumForm from './AddAlbumForm'
import Copyright from './Copyright'
import AlbumGrid from './AlbumGrid'

export default function Albums() {
  // stuff for add album dialog
  const [open, setOpen] = React.useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <Container>
      <CssBaseline />
      <main>
        {/* Hero unit */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            pt: 8,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              variant="h2"
              align="center"
              color="text.primary"
              gutterBottom
            >
              Albums
            </Typography>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Page to manage albums and ratings
            </Typography>
            <Stack
              sx={{ pt: 4 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Button variant="contained" onClick={handleOpen}>Add album</Button>
              <AddAlbumForm open={open} handleClose={handleClose} />
            </Stack>
          </Container>
        </Box>
        <AlbumGrid />
      </main>
      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
        <Copyright />
      </Box>
      {/* End footer */}
    </Container>
  )
}
