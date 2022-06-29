import { Avatar, Button, Card, CardActions, CardContent, CardHeader, CardMedia, IconButton, Typography } from "@mui/material"
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { red } from '@mui/material/colors'

export default function AlbumCard({ album }) {
    console.log(album)
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: red[500] }} aria-label="album">
                        PT
                    </Avatar>
                }
                action={
                    <IconButton aria-label="settings">
                        <MoreVertIcon />
                    </IconButton>
                }
                title={album.artist.name}
                subheader={album.artist.country}
            />
            <CardMedia
                component="img"
                sx={{
                    // 16:9
                    pt: '0%',
                }}
                image={album.albumCover == null ? "" : album.albumCover}
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h6">{album.title}</Typography>
                <Typography variant="subtitle2" component="h6">{album.releaseDate}</Typography>
            </CardContent>
            <CardActions>
                <Button size="small">View</Button>
                <Button size="small">Edit</Button>
            </CardActions>
        </Card>
    )
}
