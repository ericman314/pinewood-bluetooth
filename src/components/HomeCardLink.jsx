import React from 'react'
import { Card, CardActionArea, CardContent, Grid, Typography } from '@material-ui/core'
import { Link } from 'react-router-dom'

export function HomeCardLink({ title, caption, to }) {

  return (
    <Grid item xs={6} sm={4} md={3}>

      <Card className='homeCardLink'>
        <CardActionArea>
          <CardContent>
            <Link to={to}>
              <Typography gutterBottom variant="h5" component="h2">
                {title}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                {caption}
              </Typography>
            </Link>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  )

}
