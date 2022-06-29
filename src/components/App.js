import React from 'react'
import '../styles/App.css'
import ResponsiveAppBar from './ResponsiveAppBar'
import Toolbar from '@mui/material/Toolbar'
import ScrollTop from './ScrollTop'
import Fab from '@mui/material/Fab'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { Route, Routes } from 'react-router'
import Albums from './Albums'
import Home from './Home'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../styles/style'
import Login from './user/Login'
import Notification from './Notification'
import Loading from './Loading'

export default function App(props) {
  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <Loading />
        <Notification />
        <Login />
        <ResponsiveAppBar />
        <Toolbar id="back-to-top-anchor" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="Albums" element={<Albums />} />
          <Route path="Artists" element={<Home />} />
          <Route path="Statistics" element={<Home />} />
        </Routes>
        <ScrollTop {...props}>
          <Fab color="secondary" size="small" aria-label="scroll back to top">
            <KeyboardArrowUpIcon />
          </Fab>
        </ScrollTop>
      </ThemeProvider>
    </React.Fragment>
  )
}
