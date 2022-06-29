import { Container, Grid } from "@mui/material";
import { useQuery, gql } from '@apollo/client'
import AlbumCard from "./AlbumCard"

const ALBUMS_QUERY = gql`
query {
  allAlbums {
    id
    artist { name, country }
    title
    releaseDate
    albumCover
  }
}
`

export default function AlbumGrid() {
    const { error, data, loading } = useQuery(ALBUMS_QUERY)
    console.log({ error, loading, data })

    if (loading) return <div>loading...</div>

    if (error) return <div>something went wrong</div>

    return (
        <Container sx={{ py: 8 }} maxWidth="md">
            {/* End hero unit */}
            <Grid container spacing={4}>
                {data.allAlbums.map((album) => (
                    <Grid item key={album.id} xs={12} sm={6} md={4}>
                        <AlbumCard album={album} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    )
}