import React from 'react'
import { Card, CardActionArea, CardContent, Typography } from '@material-ui/core'
import { Link } from 'react-router-dom'

export function HomeCardLink({ title, caption, to }) {

  return (

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
  )

}
